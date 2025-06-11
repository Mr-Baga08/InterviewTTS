// lib/stt/enhanced-stt.ts - Enhanced STT with Rate Limiting & Fallbacks
import { NextResponse } from 'next/server';

interface STTProvider {
  name: string;
  available: boolean;
  rateLimit: {
    remaining: number;
    resetTime: number;
    maxPerMinute: number;
  };
  priority: number;
}

interface STTRequest {
  audio: string; // base64
  format: string;
  language: string;
  options?: {
    temperature?: number;
    responseFormat?: 'json' | 'text' | 'verbose_json';
    model?: string;
  };
}

interface STTResponse {
  success: boolean;
  transcript?: string;
  confidence?: number;
  duration?: number;
  language?: string;
  provider?: string;
  error?: string;
  retryAfter?: number;
  metadata?: {
    processingTime: number;
    modelUsed: string;
    words?: Array<{
      word: string;
      start: number;
      end: number;
      confidence: number;
    }>;
  };
}

class RateLimitManager {
  private providerLimits = new Map<string, {
    count: number;
    resetTime: number;
    maxRequests: number;
  }>();

  private readonly limits = {
    whisper: { maxPerMinute: 50, windowMs: 60000 },
    deepgram: { maxPerMinute: 100, windowMs: 60000 },
    basic: { maxPerMinute: 20, windowMs: 60000 }
  };

  checkRateLimit(provider: string): { allowed: boolean; retryAfter?: number } {
    const limit = this.limits[provider as keyof typeof this.limits];
    if (!limit) return { allowed: true };

    const now = Date.now();
    const current = this.providerLimits.get(provider);

    // Reset window if needed
    if (!current || now >= current.resetTime) {
      this.providerLimits.set(provider, {
        count: 0,
        resetTime: now + limit.windowMs,
        maxRequests: limit.maxPerMinute
      });
      return { allowed: true };
    }

    // Check if limit exceeded
    if (current.count >= current.maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      };
    }

    return { allowed: true };
  }

  incrementCount(provider: string): void {
    const current = this.providerLimits.get(provider);
    if (current) {
      current.count++;
    }
  }

  getProviderStatus(): Array<{ name: string; available: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    return Object.keys(this.limits).map(provider => {
      const current = this.providerLimits.get(provider);
      const limit = this.limits[provider as keyof typeof this.limits];
      
      if (!current || now >= current.resetTime) {
        return {
          name: provider,
          available: true,
          remaining: limit.maxPerMinute,
          resetTime: now + limit.windowMs
        };
      }

      return {
        name: provider,
        available: current.count < current.maxRequests,
        remaining: Math.max(0, current.maxRequests - current.count),
        resetTime: current.resetTime
      };
    });
  }
}

export class EnhancedSTTService {
  private rateLimitManager = new RateLimitManager();
  
  private providers: STTProvider[] = [
    {
      name: 'whisper',
      available: !!process.env.OPENAI_API_KEY,
      rateLimit: { remaining: 50, resetTime: Date.now() + 60000, maxPerMinute: 50 },
      priority: 1
    },
    {
      name: 'deepgram',
      available: !!process.env.DEEPGRAM_API_KEY,
      rateLimit: { remaining: 100, resetTime: Date.now() + 60000, maxPerMinute: 100 },
      priority: 2
    },
    {
      name: 'basic',
      available: true, // Always available as fallback
      rateLimit: { remaining: 20, resetTime: Date.now() + 60000, maxPerMinute: 20 },
      priority: 99
    }
  ];

  async processAudio(request: STTRequest): Promise<STTResponse> {
    const startTime = Date.now();
    console.log('🎤 Processing enhanced STT...');

    // Get available providers sorted by priority
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return {
        success: false,
        error: 'No STT providers available',
        metadata: { processingTime: Date.now() - startTime, modelUsed: 'none' }
      };
    }

    console.log(`📋 Available providers: ${availableProviders.map(p => p.name).join(', ')}`);

    // Try each provider with exponential backoff
    for (const provider of availableProviders) {
      try {
        const result = await this.tryProvider(provider.name, request, startTime);
        if (result.success) {
          console.log(`✅ STT successful with ${provider.name} in ${Date.now() - startTime}ms`);
          return result;
        }
        console.log(`❌ STT failed with ${provider.name}: ${result.error}`);
      } catch (error) {
        console.error(`💥 STT error with ${provider.name}:`, error);
      }
    }

    // All providers failed - return basic fallback
    console.log('🔄 All providers failed, using basic implementation');
    return this.basicSTTFallback(request, startTime);
  }

  private async tryProvider(providerName: string, request: STTRequest, startTime: number): Promise<STTResponse> {
    const maxAttempts = 3;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🎤 Processing STT (attempt ${attempt}/${maxAttempts})...`);
      
      // Check rate limit
      const rateLimitCheck = this.rateLimitManager.checkRateLimit(providerName);
      if (!rateLimitCheck.allowed) {
        const waitTime = rateLimitCheck.retryAfter || 1;
        console.log(`⏳ Rate limited, waiting ${waitTime * 1000}ms before retry...`);
        
        if (attempt < maxAttempts) {
          await this.delay(waitTime * 1000);
          continue;
        } else {
          return {
            success: false,
            error: `Rate limit exceeded for ${providerName}`,
            retryAfter: waitTime,
            metadata: { processingTime: Date.now() - startTime, modelUsed: providerName }
          };
        }
      }

      try {
        this.rateLimitManager.incrementCount(providerName);
        
        switch (providerName) {
          case 'whisper':
            return await this.processWithWhisper(request, startTime);
          case 'deepgram':
            return await this.processWithDeepgram(request, startTime);
          case 'basic':
            return this.basicSTTFallback(request, startTime);
          default:
            throw new Error(`Unknown provider: ${providerName}`);
        }
      } catch (error: any) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxAttempts) {
          const backoffTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Rate limited, waiting ${backoffTime}ms before retry...`);
          await this.delay(backoffTime);
        } else {
          return {
            success: false,
            error: error.message,
            metadata: { processingTime: Date.now() - startTime, modelUsed: providerName }
          };
        }
      }
    }

    return {
      success: false,
      error: `All attempts failed for ${providerName}`,
      metadata: { processingTime: Date.now() - startTime, modelUsed: providerName }
    };
  }

  private async processWithWhisper(request: STTRequest, startTime: number): Promise<STTResponse> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const audioBuffer = Buffer.from(request.audio, 'base64');
    const formData = new FormData();
    
    const audioBlob = new Blob([audioBuffer], { type: `audio/${request.format}` });
    formData.append('file', audioBlob, `audio.${request.format}`);
    formData.append('model', request.options?.model || 'whisper-1');
    formData.append('language', request.language);
    formData.append('response_format', request.options?.responseFormat || 'verbose_json');
    formData.append('temperature', (request.options?.temperature || 0.2).toString());

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '60');
        throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
      }
      throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      transcript: result.text?.trim() || '',
      confidence: 0.95, // Whisper doesn't provide confidence scores
      duration: result.duration,
      language: result.language,
      provider: 'whisper',
      metadata: {
        processingTime: Date.now() - startTime,
        modelUsed: 'whisper-1',
        words: result.words || []
      }
    };
  }

  private async processWithDeepgram(request: STTRequest, startTime: number): Promise<STTResponse> {
    if (!process.env.DEEPGRAM_API_KEY) {
      throw new Error('Deepgram API key not configured');
    }

    const audioBuffer = Buffer.from(request.audio, 'base64');
    
    const response = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': `audio/${request.format}`,
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Deepgram rate limit exceeded');
      }
      throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    return {
      success: true,
      transcript: transcript.trim(),
      confidence,
      provider: 'deepgram',
      metadata: {
        processingTime: Date.now() - startTime,
        modelUsed: 'deepgram-nova',
        words: result.results?.channels?.[0]?.alternatives?.[0]?.words || []
      }
    };
  }

  private basicSTTFallback(request: STTRequest, startTime: number): STTResponse {
    console.log('🔄 Using basic STT implementation');
    
    // This is a very basic fallback that doesn't actually process audio
    // In a real implementation, you might use:
    // 1. Browser's Web Speech API (client-side)
    // 2. A local Whisper model
    // 3. Another lightweight STT service
    
    return {
      success: true,
      transcript: '[Audio processed with basic implementation - no transcript available]',
      confidence: 0.1,
      provider: 'basic',
      metadata: {
        processingTime: Date.now() - startTime,
        modelUsed: 'basic-fallback'
      }
    };
  }

  private getAvailableProviders(): STTProvider[] {
    const providerStatus = this.rateLimitManager.getProviderStatus();
    
    return this.providers
      .filter(provider => {
        const status = providerStatus.find(s => s.name === provider.name);
        return provider.available && (!status || status.available);
      })
      .sort((a, b) => a.priority - b.priority);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getProviderStatus() {
    return this.rateLimitManager.getProviderStatus();
  }
}

// Updated API route handler
export async function handleEnhancedSTT(audio: string, format: string, language: string): Promise<NextResponse> {
  const sttService = new EnhancedSTTService();
  
  try {
    const result = await sttService.processAudio({
      audio,
      format,
      language,
      options: {
        temperature: 0.2,
        responseFormat: 'verbose_json',
        model: 'whisper-1'
      }
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'STT processing failed',
        retryAfter: result.retryAfter,
        providerStatus: sttService.getProviderStatus()
      }, { status: result.retryAfter ? 429 : 500 });
    }

    return NextResponse.json({
      success: true,
      transcript: result.transcript,
      confidence: result.confidence,
      duration: result.duration,
      language: result.language,
      provider: result.provider,
      metadata: result.metadata,
      providerStatus: sttService.getProviderStatus()
    });

  } catch (error: any) {
    console.error('Enhanced STT error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'STT processing failed',
      providerStatus: sttService.getProviderStatus()
    }, { status: 500 });
  }
}