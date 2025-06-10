// types/livekit.ts - Core LiveKit Pipeline Types
export interface VoicePipelineConfig {
    // STT Configuration
    stt: {
      provider: 'whisper' | 'vosk' | 'deepgram';
      model?: string;
      language: string;
      continuous: boolean;
      vadEnabled: boolean;
    };
    
    // LLM Configuration
    llm: {
      provider: 'openai' | 'ollama' | 'lmstudio';
      model: string;
      temperature: number;
      maxTokens: number;
      systemPrompt: string;
    };
    
    // TTS Configuration
    tts: {
      provider: 'elevenlabs' | 'coqui' | 'openai';
      voice: string;
      speed: number;
      stability?: number;
    };
    
    // VAD Configuration
    vad: {
      enabled: boolean;
      threshold: number;
      minSpeechFrames: number;
      preSpeechPadFrames: number;
      redemptionFrames: number;
    };
  }
  
  export interface VoiceMessage {
    id: string;
    type: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    audioData?: ArrayBuffer;
    confidence?: number;
    duration?: number;
  }
  
  export interface PipelineState {
    isListening: boolean;
    isSpeaking: boolean;
    isProcessing: boolean;
    currentMessage?: VoiceMessage;
    error?: string;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  }
  
  export interface InterviewSession {
    id: string;
    userId: string;
    interviewId: string;
    questions: string[];
    currentQuestionIndex: number;
    messages: VoiceMessage[];
    startTime: number;
    endTime?: number;
    status: 'active' | 'paused' | 'completed' | 'error';
  }
  
  // LiveKit Events
  export interface LiveKitEvents {
    onConnectionStatusChanged: (status: PipelineState['connectionStatus']) => void;
    onMessageReceived: (message: VoiceMessage) => void;
    onTranscriptReceived: (transcript: string, isFinal: boolean) => void;
    onSpeechStarted: () => void;
    onSpeechEnded: () => void;
    onError: (error: Error) => void;
  }
  
  // Pipeline Components Interface
  export interface STTComponent {
    start(): Promise<void>;
    stop(): Promise<void>;
    onAudioData(data: Float32Array): void;
    onTranscript: (callback: (text: string, isFinal: boolean) => void) => void;
  }
  
  export interface LLMComponent {
    generateResponse(prompt: string, context: VoiceMessage[]): Promise<string>;
    setSystemPrompt(prompt: string): void;
  }
  
  export interface TTSComponent {
    synthesize(text: string): Promise<ArrayBuffer>;
    setVoice(voiceId: string): void;
  }
  
  export interface VADComponent {
    start(): Promise<void>;
    stop(): Promise<void>;
    onAudioData(data: Float32Array): boolean; // Returns true if speech detected
    onSpeechStart: (callback: () => void) => void;
    onSpeechEnd: (callback: () => void) => void;
  }