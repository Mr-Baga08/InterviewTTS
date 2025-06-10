// app/api/stt/route.ts - Speech-to-Text API
import { NextRequest, NextResponse } from 'next/server';

interface STTRequest {
  audio: string; // Base64 encoded audio
  format?: 'wav' | 'mp3' | 'webm';
  language?: string;
  continuous?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: STTRequest = await request.json();
    const { audio, format = 'wav', language = 'en', continuous = false } = body;

    if (!audio) {
      return NextResponse.json(
        { error: 'Audio data is required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    
    // Create FormData for Whisper API
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { 
      type: `audio/${format}` 
    });
    
    formData.append('file', audioBlob, `audio.${format}`);
    formData.append('model', 'whisper-1');
    formData.append('language', language);
    formData.append('response_format', 'json');
    
    if (continuous) {
      formData.append('temperature', '0.2');
      formData.append('timestamp_granularities[]', 'word');
    }

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      transcript: result.text,
      confidence: result.confidence || 1.0,
      words: result.words || [],
      language: result.language,
      duration: result.duration,
    });

  } catch (error: any) {
    console.error('❌ STT API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Speech recognition failed' 
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'speech-to-text',
    provider: 'openai-whisper',
    timestamp: new Date().toISOString(),
  });
}