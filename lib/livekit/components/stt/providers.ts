// lib/stt/providers.ts - Multi-provider STT implementation
import { NextResponse } from 'next/server';

export interface STTResult {
  success: boolean;
  transcript?: string;
  confidence?: number;
  duration?: number;
  language?: string;
  error?: string;
  provider?: string;
}

export interface STTProvider {
  transcribe(audio: string, format: string, language: string): Promise<STTResult>;
  isAvailable(): boolean;
  getRateLimit(): { remaining: number; resetTime: number };
  name: string;
}

// Rate Limiter for providers
export class RateLimiter {
  private requests: number[] = [];
  readonly maxRequests: number;
  readonly windowMs: number;

  constructor(maxRequests = 50, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getWaitTime(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    const waitTime = this.windowMs - (Date.now() - oldestRequest);
    return Math.max(0, waitTime);
  }

  getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// OpenAI Whisper Provider
export class OpenAIWhisperProvider implements STTProvider {
  private rateLimiter = new RateLimiter(50, 60000); // 50 requests per minute
  public name = 'OpenAI Whisper';

  async transcribe(audio: string, format: string, language: string): Promise<STTResult> {
    try {
      if (!this.isAvailable()) {
        throw new Error('Rate limit exceeded');
      }

      const audioBuffer = Buffer.from(audio, 'base64');
      const formData = new FormData();
      
      const audioBlob = new Blob([audioBuffer], { type: `audio/${format}` });
      formData.append('file', audioBlob, `audio.${format}`);
      formData.append('model', 'whisper-1');
      formData.append('language', language);
      formData.append('response_format', 'json');
      formData.append('temperature', '0.2');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OpenAI Whisper error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      this.rateLimiter.recordRequest();

      return {
        success: true,
        transcript: result.text,
        confidence: result.confidence || 1.0,
        duration: result.duration,
        language: result.language,
        provider: this.name
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY && this.rateLimiter.canMakeRequest();
  }

  getRateLimit() {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      resetTime: this.rateLimiter.getWaitTime()
    };
  }
}

// Deepgram Provider (Alternative)
export class DeepgramProvider implements STTProvider {
  private rateLimiter = new RateLimiter(1000, 60000); // Higher limit for Deepgram
  public name = 'Deepgram';

  async transcribe(audio: string, format: string, language: string): Promise<STTResult> {
    try {
      const audioBuffer = Buffer.from(audio, 'base64');
      
      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': `audio/${format}`,
        },
        body: audioBuffer,
      });

      if (!response.ok) {
        throw new Error(`Deepgram error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

      this.rateLimiter.recordRequest();

      return {
        success: true,
        transcript,
        confidence,
        language: result.results?.channels?.[0]?.detected_language || language,
        provider: this.name
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }

  isAvailable(): boolean {
    return !!process.env.DEEPGRAM_API_KEY && this.rateLimiter.canMakeRequest();
  }

  getRateLimit() {
    return {
      remaining: this.rateLimiter.getRemainingRequests(),
      resetTime: this.rateLimiter.getWaitTime()
    };
  }
}

// STT Manager with failover
export class STTManager {
  private providers: STTProvider[] = [
    new OpenAIWhisperProvider(),
    new DeepgramProvider(),
  ];

  async transcribe(audio: string, format: string, language: string): Promise<STTResult> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        errors.push(`${provider.name}: Not available`);
        continue;
      }

      console.log(`🎤 Trying ${provider.name}...`);
      const result = await provider.transcribe(audio, format, language);
      
      if (result.success) {
        console.log(`✅ STT Success with ${provider.name}`);
        return result;
      }

      errors.push(`${provider.name}: ${result.error}`);
      console.log(`❌ STT Failed with ${provider.name}:`, result.error);
    }

    return {
      success: false,
      error: `All STT providers failed: ${errors.join(', ')}`
    };
  }

  getProviderStatus() {
    return this.providers.map(provider => ({
      name: provider.name,
      available: provider.isAvailable(),
      rateLimit: provider.getRateLimit()
    }));
  }

  // Method to get the best available provider
  getBestProvider(): STTProvider | null {
    return this.providers.find(provider => provider.isAvailable()) || null;
  }
}

// Export singleton instance
export const sttManager = new STTManager();