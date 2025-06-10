// lib/livekit/config.ts - LiveKit Configuration
import { VoicePipelineConfig } from '@/types/livekit';

export const LIVEKIT_CONFIG = {
  // LiveKit Server Configuration
  server: {
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://localhost:7880',
    apiKey: process.env.LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
  },
  
  // Room Configuration
  room: {
    name: 'interview-room',
    maxParticipants: 2, // User + AI Agent
    emptyTimeout: 300, // 5 minutes
    maxDuration: 3600, // 1 hour
  },
  
  // Audio Configuration
  audio: {
    sampleRate: 16000,
    channels: 1,
    bitDepth: 16,
    frameSize: 480, // 30ms at 16kHz
  }
};

// Default Pipeline Configuration
export const DEFAULT_PIPELINE_CONFIG: VoicePipelineConfig = {
  stt: {
    provider: 'whisper',
    model: 'whisper-1',
    language: 'en',
    continuous: true,
    vadEnabled: true,
  },
  
  llm: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 300,
    systemPrompt: 'You are a professional AI interviewer conducting a technical interview. Keep responses concise and conversational.',
  },
  
  tts: {
    provider: 'openai',
    voice: 'nova',
    speed: 1.0,
  },
  
  vad: {
    enabled: true,
    threshold: 0.5,
    minSpeechFrames: 10,
    preSpeechPadFrames: 10,
    redemptionFrames: 8,
  }
};

// Environment Validation
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    'NEXT_PUBLIC_LIVEKIT_URL',
    'LIVEKIT_API_KEY', 
    'LIVEKIT_API_SECRET',
    'OPENAI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// Pipeline Provider Configurations
export const PROVIDER_CONFIGS = {
  stt: {
    whisper: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'whisper-1',
      temperature: 0,
    },
    vosk: {
      modelPath: '/models/vosk-model-en-us-0.22',
      sampleRate: 16000,
    },
    deepgram: {
      apiKey: process.env.DEEPGRAM_API_KEY,
      model: 'nova-2',
      language: 'en-US',
    }
  },
  
  llm: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    },
    ollama: {
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama2',
    },
    lmstudio: {
      baseURL: process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234/v1',
    }
  },
  
  tts: {
    elevenlabs: {
      apiKey: process.env.ELEVENLABS_API_KEY,
      voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'tts-1',
    },
    coqui: {
      baseURL: process.env.COQUI_BASE_URL || 'http://localhost:5002',
      model: process.env.COQUI_MODEL || 'tts_models/en/ljspeech/tacotron2-DDC',
    }
  }
};

// Interview-specific configurations
export const INTERVIEW_CONFIGS = {
  technical: {
    systemPrompt: `You are conducting a technical interview. Ask clear, specific questions about programming concepts, system design, and problem-solving. Keep responses under 30 seconds when spoken. Be professional but encouraging.`,
    temperature: 0.6,
    maxResponseTime: 120, // 2 minutes per response
  },
  
  behavioral: {
    systemPrompt: `You are conducting a behavioral interview using the STAR method. Ask about past experiences, teamwork, and problem-solving situations. Guide candidates through structured responses. Keep responses conversational and under 30 seconds.`,
    temperature: 0.7,
    maxResponseTime: 180, // 3 minutes per response
  },
  
  mixed: {
    systemPrompt: `You are conducting a comprehensive interview mixing technical and behavioral questions. Adapt your style based on the question type. Maintain professional tone while being supportive. Keep responses concise for voice interaction.`,
    temperature: 0.65,
    maxResponseTime: 150, // 2.5 minutes per response
  }
};