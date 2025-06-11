// app/api/voice/pipeline/route.ts - Complete Enhanced Pipeline
import { NextRequest, NextResponse } from 'next/server';

// Try to import the new utilities, fallback if they don't exist yet
let sttManager: any = null;
let AudioOptimizer: any = null;

try {
  const sttModule = require('@/lib/livekit/components/stt/providers');
  sttManager = sttModule.sttManager;
} catch (error) {
  console.warn('STT providers not available, using basic implementation');
}

try {
  const audioModule = require('@/lib/audio/optimizer');
  AudioOptimizer = audioModule.AudioOptimizer;
} catch (error) {
  console.warn('Audio optimizer not available, using basic validation');
}

interface VoicePipelineRequest {
  audio?: string;
  text?: string;
  message?: string;
  context?: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: number }>;
  action: 'stt' | 'llm' | 'tts' | 'pipeline' | 'stt-status';
  format?: 'wav' | 'mp3' | 'webm';
  language?: string;
  voice?: string;
  provider?: {
    stt?: 'whisper' | 'deepgram';
    llm?: 'openai' | 'anthropic';
    tts?: 'openai' | 'elevenlabs' | 'coqui';
  };
  interviewConfig?: {
    type: 'technical' | 'behavioral' | 'mixed';
    questions: string[];
    currentIndex: number;
  };
}

// Rate Limiter Class
class WhisperRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

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

// Global rate limiter
const whisperRateLimiter = new WhisperRateLimiter();

// Enhanced STT Handler
async function handleSTT(audio: string, format: string, language: string): Promise<NextResponse> {
  try {
    console.log('🎤 Processing enhanced STT...');
    
    // Convert base64 to blob for validation
    const audioBuffer = Buffer.from(audio, 'base64');
    const audioBlob = new Blob([audioBuffer], { type: `audio/${format}` });
    
    // Basic validation if AudioOptimizer is not available
    if (AudioOptimizer) {
      const validation = AudioOptimizer.validateAudio(audioBlob);
      if (!validation.isValid) {
        return NextResponse.json({
          success: false,
          error: validation.error,
          code: 'INVALID_AUDIO'
        }, { status: 400 });
      }

      // Optimize audio
      const optimization = await AudioOptimizer.optimizeAudioBlob(audioBlob);
      if (!optimization.containsSpeech) {
        return NextResponse.json({
          success: false,
          error: 'No speech detected in audio',
          suggestion: 'Please try speaking more clearly or check your microphone.',
          code: 'NO_SPEECH_DETECTED'
        }, { status: 400 });
      }
    } else {
      // Basic validation fallback
      if (audioBuffer.length < 1000) {
        return NextResponse.json({
          success: false,
          error: 'Audio file too small',
          code: 'INVALID_AUDIO'
        }, { status: 400 });
      }
    }

    // Use STT manager if available, otherwise use basic Whisper
    if (sttManager) {
      const result = await sttManager.transcribe(audio, format, language);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          transcript: result.transcript,
          confidence: result.confidence || 1.0,
          duration: result.duration,
          language: result.language,
          provider: result.provider,
          metadata: {
            audioSize: audioBuffer.length,
            enhanced: true
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error,
          providerStatus: sttManager.getProviderStatus(),
          fallback: 'Please try again or speak more clearly.',
          code: 'STT_PROVIDER_FAILED'
        }, { status: 500 });
      }
    } else {
      // Fallback to basic Whisper implementation
      return await handleBasicSTT(audio, format, language);
    }

  } catch (error: any) {
    console.error('Enhanced STT Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Speech recognition failed',
      code: 'STT_PROCESSING_ERROR'
    }, { status: 500 });
  }
}

// Basic STT fallback with retry logic
async function handleBasicSTT(audio: string, format: string, language: string, maxRetries = 3): Promise<NextResponse> {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Check rate limit
  if (!whisperRateLimiter.canMakeRequest()) {
    const waitTime = whisperRateLimiter.getWaitTime();
    return NextResponse.json({
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(waitTime / 1000),
      message: `Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`
    }, { status: 429 });
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎤 Processing STT (attempt ${attempt}/${maxRetries})...`);
      
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

      if (response.ok) {
        const result = await response.json();
        whisperRateLimiter.recordRequest();
        
        return NextResponse.json({
          success: true,
          transcript: result.text,
          confidence: result.confidence || 1.0,
          duration: result.duration,
          language: result.language,
          provider: 'openai-whisper',
          attempt,
          metadata: {
            audioSize: audioBuffer.length,
            enhanced: false
          }
        });
      }

      // Handle rate limiting
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
        continue;
      }

      // Handle client errors (don't retry)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
      }

      // Server error - retry
      console.log(`🔄 Server error ${response.status}, retrying...`);
      await delay(1000 * attempt);
      
    } catch (error: any) {
      console.error(`STT Attempt ${attempt} Error:`, error);
      
      if (attempt === maxRetries) {
        return NextResponse.json({
          success: false,
          error: error.message,
          fallback: "Please try speaking again or check your connection.",
          attempts: attempt
        }, { status: 500 });
      }
      
      await delay(1000 * attempt);
    }
  }

  // This should never be reached, but TypeScript needs it
  return NextResponse.json({
    success: false,
    error: 'Maximum retries exceeded',
    fallback: "Please try speaking again or check your connection."
  }, { status: 500 });
}

// STT Status Handler
async function handleSTTStatus(): Promise<NextResponse> {
  try {
    if (sttManager) {
      const status = sttManager.getProviderStatus();
      const bestProvider = sttManager.getBestProvider();
      
      return NextResponse.json({
        success: true,
        providers: status,
        recommended: bestProvider?.name || 'None available',
        enhanced: true,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: true,
        providers: [
          {
            name: 'OpenAI Whisper',
            available: !!process.env.OPENAI_API_KEY && whisperRateLimiter.canMakeRequest(),
            rateLimit: {
              remaining: whisperRateLimiter.getRemainingRequests(),
              resetTime: whisperRateLimiter.getWaitTime()
            }
          }
        ],
        recommended: 'OpenAI Whisper',
        enhanced: false,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// LLM Handler
async function handleLLM(
  message: string, 
  context: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: number }>,
  interviewConfig?: { type: string; questions: string[]; currentIndex: number }
): Promise<NextResponse> {
  try {
    console.log('🤖 Processing LLM...');
    
    const messages = [];
    
    // System prompt based on interview type
    const systemPrompt = buildSystemPrompt(interviewConfig);
    messages.push({ role: 'system' as const, content: systemPrompt });
    
    // Add conversation context (last 10 messages)
    const recentContext = context.slice(-10);
    messages.push(...recentContext);
    
    // Add current message
    messages.push({ role: 'user' as const, content: message });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 300,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content?.trim() || '';
    
    // Determine next question
    let nextQuestion = '';
    let isComplete = false;
    
    if (interviewConfig) {
      const { questions, currentIndex } = interviewConfig;
      isComplete = currentIndex >= questions.length;
      if (!isComplete && currentIndex < questions.length) {
        nextQuestion = questions[currentIndex];
      }
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      nextQuestion: nextQuestion || undefined,
      isComplete,
      metadata: {
        model: 'gpt-4o-mini',
        tokens: result.usage?.total_tokens || 0
      }
    });
  } catch (error: any) {
    console.error('LLM Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// TTS Handler
async function handleTTS(text: string, voice = 'nova', provider = 'openai'): Promise<NextResponse> {
  try {
    console.log('🔊 Processing TTS...');
    
    let audioBuffer: ArrayBuffer;
    let format = 'mp3';
    
    switch (provider) {
      case 'openai':
        audioBuffer = await synthesizeWithOpenAI(text, voice);
        format = 'mp3';
        break;
        
      case 'elevenlabs':
        audioBuffer = await synthesizeWithElevenLabs(text, voice);
        format = 'mp3';
        break;
        
      default:
        // Fallback to OpenAI
        audioBuffer = await synthesizeWithOpenAI(text, voice);
        format = 'mp3';
        break;
    }
    
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({
      success: true,
      audio: audioBase64,
      format,
      provider,
      duration: estimateAudioDuration(text),
      metadata: {
        voice,
        size: audioBuffer.byteLength
      }
    });
  } catch (error: any) {
    console.error('TTS Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Full Pipeline Handler
async function handleFullPipeline(
  audio: string,
  format: string,
  language: string,
  context: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: number }>,
  interviewConfig?: { type: string; questions: string[]; currentIndex: number },
  providers?: { stt?: string; llm?: string; tts?: string }
): Promise<NextResponse> {
  try {
    console.log('🔄 Processing full pipeline...');
    
    // Step 1: STT
    const sttResult = await handleSTT(audio, format, language);
    const sttData = await sttResult.json();
    
    if (!sttData.success || !sttData.transcript?.trim()) {
      return NextResponse.json({
        success: false,
        error: sttData.error || 'No speech detected',
        step: 'stt',
        details: sttData
      });
    }
    
    const transcript = sttData.transcript.trim();
    
    // Step 2: LLM
    const llmResult = await handleLLM(transcript, context, interviewConfig);
    const llmData = await llmResult.json();
    
    if (!llmData.success) {
      return NextResponse.json({
        success: false,
        error: llmData.error || 'Failed to generate response',
        step: 'llm',
        transcript,
        details: llmData
      });
    }
    
    // Step 3: TTS
    const ttsResult = await handleTTS(llmData.response, 'nova', providers?.tts || 'openai');
    const ttsData = await ttsResult.json();
    
    if (!ttsData.success) {
      return NextResponse.json({
        success: false,
        error: ttsData.error || 'Failed to generate speech',
        step: 'tts',
        transcript,
        response: llmData.response,
        details: ttsData
      });
    }
    
    return NextResponse.json({
      success: true,
      transcript,
      response: llmData.response,
      audio: ttsData.audio,
      format: ttsData.format,
      nextQuestion: llmData.nextQuestion,
      isComplete: llmData.isComplete,
      metadata: {
        stt: sttData.metadata || {},
        llm: llmData.metadata || {},
        tts: ttsData.metadata || {}
      }
    });
  } catch (error: any) {
    console.error('Pipeline Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      step: 'pipeline'
    }, { status: 500 });
  }
}

// Helper Functions
function buildSystemPrompt(interviewConfig?: { type: string; questions: string[]; currentIndex: number }): string {
  const basePrompt = "You are a professional AI interviewer conducting a voice interview. Keep responses concise (2-3 sentences max) and conversational for voice interaction.";
  
  if (!interviewConfig) {
    return basePrompt + " Have a natural conversation and ask thoughtful follow-up questions.";
  }
  
  const { type, questions, currentIndex } = interviewConfig;
  
  const typeGuidance = {
    technical: "Focus on technical skills, problem-solving approaches, and implementation details.",
    behavioral: "Use the STAR method and focus on past experiences, teamwork, and leadership.",
    mixed: "Alternate between technical depth and behavioral insights."
  };
  
  return `${basePrompt}\n\nINTERVIEW TYPE: ${type}\n${typeGuidance[type as keyof typeof typeGuidance] || typeGuidance.mixed}\n\nPROGRESS: Question ${currentIndex + 1} of ${questions.length}\n\nRemain focused and professional while being conversational.`;
}

async function synthesizeWithOpenAI(text: string, voice: string): Promise<ArrayBuffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: 'mp3',
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS API error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

async function synthesizeWithElevenLabs(text: string, voiceId: string): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.85,
        }
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

function estimateAudioDuration(text: string): number {
  // Rough estimation: average speaking rate is ~150 words per minute
  const words = text.split(' ').length;
  return Math.max(1, Math.round((words / 150) * 60));
}

// Main POST Handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: VoicePipelineRequest = await request.json();
    const { action, audio, text, message, context = [], format = 'webm', language = 'en' } = body;

    switch (action) {
      case 'stt':
        return await handleSTT(audio!, format, language);
      
      case 'stt-status':
        return await handleSTTStatus();
      
      case 'llm':
        return await handleLLM(message!, context, body.interviewConfig);
      
      case 'tts':
        return await handleTTS(text!, body.voice, body.provider?.tts);
      
      case 'pipeline':
        return await handleFullPipeline(audio!, format, language, context, body.interviewConfig, body.provider);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Voice pipeline error:', error);
    return NextResponse.json({
      error: error.message || 'Pipeline processing failed',
      processingTime: Date.now() - startTime
    }, { status: 500 });
  }
}

// GET Handler for Health Checks
export async function GET() {
  try {
    const status = await handleSTTStatus();
    const statusData = await status.json();
    
    return NextResponse.json({
      status: 'ok',
      service: 'voice-pipeline',
      providers: statusData.providers || [],
      enhanced: statusData.enhanced || false,
      timestamp: new Date().toISOString(),
      environment: {
        openai: !!process.env.OPENAI_API_KEY,
        elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      service: 'voice-pipeline',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}