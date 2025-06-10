// app/api/tts/route.ts - Text-to-Speech API
import { NextRequest, NextResponse } from 'next/server';

interface TTSRequest {
  text: string;
  voice?: string;
  provider?: 'openai' | 'elevenlabs' | 'coqui';
  speed?: number;
  format?: 'mp3' | 'wav' | 'opus';
  quality?: 'low' | 'medium' | 'high';
}

interface TTSResponse {
  success: boolean;
  audio?: string; // Base64 encoded audio
  format?: string;
  duration?: number;
  error?: string;
  metadata?: {
    provider: string;
    voice: string;
    processingTime: number;
    size: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<TTSResponse>> {
  const startTime = Date.now();

  try {
    const body: TTSRequest = await request.json();
    const {
      text,
      voice = 'nova',
      provider = 'openai',
      speed = 1.0,
      format = 'mp3',
      quality = 'medium'
    } = body;

    if (!text?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Text is required'
      }, { status: 400 });
    }

    // Truncate text if too long (most TTS services have limits)
    const truncatedText = text.length > 4000 ? text.substring(0, 4000) + '...' : text;

    let audioBuffer: ArrayBuffer;
    let audioFormat = format;

    switch (provider) {
      case 'openai':
        audioBuffer = await synthesizeWithOpenAI(truncatedText, voice, speed, format);
        break;
      
      case 'elevenlabs':
        audioBuffer = await synthesizeWithElevenLabs(truncatedText, voice, quality);
        audioFormat = 'mp3'; // ElevenLabs returns MP3
        break;
      
      case 'coqui':
        audioBuffer = await synthesizeWithCoqui(truncatedText, voice);
        audioFormat = 'wav'; // Coqui typically returns WAV
        break;
      
      default:
        throw new Error(`Unsupported TTS provider: ${provider}`);
    }

    // Convert to base64
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      audio: audioBase64,
      format: audioFormat,
      duration: estimateAudioDuration(truncatedText),
      metadata: {
        provider,
        voice,
        processingTime,
        size: audioBuffer.byteLength
      }
    });

  } catch (error: any) {
    console.error('❌ TTS API Error:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Text-to-speech synthesis failed',
      metadata: {
        provider: 'unknown',
        voice: 'unknown',
        processingTime,
        size: 0
      }
    }, { status: 500 });
  }
}

async function synthesizeWithOpenAI(
  text: string, 
  voice: string, 
  speed: number, 
  format: string
): Promise<ArrayBuffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: format,
      speed: speed,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS API error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

async function synthesizeWithElevenLabs(
  text: string, 
  voiceId: string, 
  quality: string
): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  const modelId = quality === 'high' ? 'eleven_multilingual_v2' : 'eleven_monolingual_v1';
  
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.85,
          style: 0.3,
          use_speaker_boost: true
        }
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

async function synthesizeWithCoqui(text: string, voice: string): Promise<ArrayBuffer> {
  const baseURL = process.env.COQUI_TTS_URL || 'http://localhost:5002';
  
  const response = await fetch(`${baseURL}/api/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      speaker_id: voice,
      style_wav: '',
      language_id: 'en',
    }),
  });

  if (!response.ok) {
    throw new Error(`Coqui TTS API error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

function estimateAudioDuration(text: string): number {
  // Rough estimate: ~150 words per minute, ~5 characters per word
  const wordsPerMinute = 150;
  const charactersPerWord = 5;
  const estimatedWords = text.length / charactersPerWord;
  const durationMinutes = estimatedWords / wordsPerMinute;
  return Math.max(1, Math.round(durationMinutes * 60)); // Return seconds, minimum 1 second
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'text-to-speech',
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      coqui: !!process.env.COQUI_TTS_URL,
    },
    timestamp: new Date().toISOString(),
  });
}