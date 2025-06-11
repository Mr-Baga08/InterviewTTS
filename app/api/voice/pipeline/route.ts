// app/api/voice/pipeline/route.ts - Unified Voice Pipeline
import { NextRequest, NextResponse } from 'next/server';

interface VoicePipelineRequest {
  audio?: string; // Base64 encoded audio
  text?: string; // Text for TTS
  message?: string; // Text for LLM
  context?: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: number }>;
  action: 'stt' | 'llm' | 'tts' | 'pipeline'; // Full pipeline does STT -> LLM -> TTS
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: VoicePipelineRequest = await request.json();
    const { action, audio, text, message, context = [], format = 'webm', language = 'en' } = body;

    switch (action) {
      case 'stt':
        return await handleSTT(audio!, format, language);
      
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

// STT Handler with multiple providers
async function handleSTT(audio: string, format: string, language: string) {
  try {
    console.log('🎤 Processing STT...');
    
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
      throw new Error(`Whisper API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      transcript: result.text,
      confidence: result.confidence || 1.0,
      duration: result.duration,
      language: result.language
    });
  } catch (error: any) {
    console.error('STT Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// LLM Handler with context management
async function handleLLM(
  message: string, 
  context: Array<{ role: 'user' | 'assistant'; content: string; timestamp?: number }>,
  interviewConfig?: { type: string; questions: string[]; currentIndex: number }
) {
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

// TTS Handler with multiple providers
async function handleTTS(text: string, voice = 'nova', provider = 'openai') {
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
        
      case 'coqui':
        audioBuffer = await synthesizeWithCoqui(text, voice);
        format = 'wav';
        break;
        
      default:
        throw new Error(`Unsupported TTS provider: ${provider}`);
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
) {
  try {
    console.log('🔄 Processing full pipeline...');
    
    // Step 1: STT
    const sttResult = await handleSTT(audio, format, language);
    const sttData = await sttResult.json();
    
    if (!sttData.success || !sttData.transcript?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No speech detected',
        step: 'stt'
      });
    }
    
    const transcript = sttData.transcript.trim();
    
    // Step 2: LLM
    const llmResult = await handleLLM(transcript, context, interviewConfig);
    const llmData = await llmResult.json();
    
    if (!llmData.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate response',
        step: 'llm',
        transcript
      });
    }
    
    // Step 3: TTS
    const ttsResult = await handleTTS(llmData.response, 'nova', providers?.tts || 'openai');
    const ttsData = await ttsResult.json();
    
    if (!ttsData.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate speech',
        step: 'tts',
        transcript,
        response: llmData.response
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
  
  return `${basePrompt}\n\nINTERVIEW TYPE: ${type}\n${typeGuidance[type as keyof typeof typeGuidance] || typeGuidance.mixed}\n\nPROGRESS: Question ${currentIndex + 1} of ${questions.length}\n\nCURRENT QUESTIONS:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
}

async function synthesizeWithOpenAI(text: string, voice: string): Promise<ArrayBuffer> {
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
      response_format: 'mp3',
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

async function synthesizeWithElevenLabs(text: string, voiceId: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ElevenLabs API key not configured');

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.85,
        style: 0.3,
        use_speaker_boost: true
      }
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

async function synthesizeWithCoqui(text: string, voice: string): Promise<ArrayBuffer> {
  const baseURL = process.env.COQUI_TTS_URL || 'http://localhost:5002';
  
  const response = await fetch(`${baseURL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      speaker_id: voice,
      language_id: 'en',
    }),
  });

  if (!response.ok) {
    throw new Error(`Coqui TTS error: ${response.statusText}`);
  }

  return await response.arrayBuffer();
}

function estimateAudioDuration(text: string): number {
  // Rough estimate: ~150 words per minute, ~5 characters per word
  const wordsPerMinute = 150;
  const charactersPerWord = 5;
  const estimatedWords = text.length / charactersPerWord;
  const durationMinutes = estimatedWords / wordsPerMinute;
  return Math.max(1, Math.round(durationMinutes * 60));
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'voice-pipeline',
    providers: {
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      coqui: !!process.env.COQUI_TTS_URL,
    },
    timestamp: new Date().toISOString(),
  });
}