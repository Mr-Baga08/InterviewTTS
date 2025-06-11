// hooks/useVoicePipeline.ts - Updated with Enhanced Rate Limiting
import { useState, useEffect, useRef, useCallback } from 'react';

interface EnhancedSTTResponse {
  success: boolean;
  transcript?: string;
  confidence?: number;
  provider?: string;
  error?: string;
  code?: string;
  suggestion?: string;
  retryAfter?: number;
  providerStatus?: Array<{
    name: string;
    available: boolean;
    rateLimit: { remaining: number; resetTime: number };
  }>;
}

interface VoicePipelineConfig {
  interviewType?: 'technical' | 'behavioral' | 'mixed';
  questions?: string[];
  vadThreshold?: number;
  silenceTimeout?: number;
  maxRecordingTime?: number;
  providers?: {
    stt?: 'whisper' | 'deepgram' | 'basic';
    llm?: 'openai' | 'anthropic';
    tts?: 'openai' | 'elevenlabs' | 'coqui';
  };
  rateLimiting?: {
    enabled: boolean;
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
}

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  audioUrl?: string;
  metadata?: {
    provider?: string;
    confidence?: number;
    processingTime?: number;
  };
}

interface VoicePipelineState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isRecording: boolean;
  error: string | null;
  transcript: string;
  response: string;
  currentQuestionIndex: number;
  isComplete: boolean;
  messages: VoiceMessage[];
  audioLevel: number;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

interface RateLimitState {
  isRateLimited: boolean;
  retryAfter: number;
  requestCount: number;
  lastResetTime: number;
  failedAttempts: number;
  providerStatus: Array<{
    name: string;
    available: boolean;
    remaining: number;
    resetTime: number;
  }>;
}

interface VoicePipelineActions {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  pushToTalk: () => void;
  releasePushToTalk: () => void;
  clearError: () => void;
  resetConversation: () => void;
  sendMessage: (text: string) => Promise<void>;
  retryLastRequest: () => Promise<void>;
}

interface VoicePipelineReturn extends VoicePipelineState, VoicePipelineActions {
  canStartListening: boolean;
  isActive: boolean;
  rateLimitState: RateLimitState;
  canMakeRequest: boolean;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

export function useVoicePipeline(config: VoicePipelineConfig = {}): VoicePipelineReturn {
  // Configuration with enhanced defaults
  const {
    interviewType = 'mixed',
    questions = [],
    vadThreshold = 0.01,
    silenceTimeout = 2000,
    maxRecordingTime = 30000,
    providers = {
      stt: 'whisper',
      llm: 'openai',
      tts: 'openai'
    },
    rateLimiting = {
      enabled: true,
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  } = config;

  // State
  const [state, setState] = useState<VoicePipelineState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    isRecording: false,
    error: null,
    transcript: '',
    response: '',
    currentQuestionIndex: 0,
    isComplete: false,
    messages: [],
    audioLevel: 0,
    connectionStatus: 'disconnected'
  });

  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isRateLimited: false,
    retryAfter: 0,
    requestCount: 0,
    lastResetTime: Date.now(),
    failedAttempts: 0,
    providerStatus: []
  });

  // Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastRequestRef = useRef<{ audio: string; action: string } | null>(null);

  // Update state helper
  const updateState = useCallback((updates: Partial<VoicePipelineState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Enhanced rate limit checking
  const checkRateLimit = useCallback(() => {
    if (!rateLimiting.enabled) return true;

    const now = Date.now();
    const MINUTE = 60 * 1000;
    const MAX_REQUESTS_PER_MINUTE = 30; // Reduced from 50
    
    // Reset counter every minute
    if (now - rateLimitState.lastResetTime > MINUTE) {
      setRateLimitState(prev => ({
        ...prev,
        requestCount: 0,
        lastResetTime: now,
        isRateLimited: false,
        failedAttempts: 0
      }));
      return true;
    }
    
    // Check if we're at the limit
    if (rateLimitState.requestCount >= MAX_REQUESTS_PER_MINUTE) {
      const timeUntilReset = MINUTE - (now - rateLimitState.lastResetTime);
      setRateLimitState(prev => ({
        ...prev,
        isRateLimited: true,
        retryAfter: Math.ceil(timeUntilReset / 1000)
      }));
      return false;
    }
    
    return true;
  }, [rateLimitState, rateLimiting.enabled]);

  // Enhanced pipeline request with better error handling
  const makeVoicePipelineRequest = useCallback(async (
    audio: string,
    action: 'stt' | 'llm' | 'tts' | 'pipeline' = 'stt',
    attempt: number = 1
  ): Promise<any> => {
    // Store request for potential retry
    lastRequestRef.current = { audio, action };

    // Check rate limit before making request
    if (!checkRateLimit()) {
      updateState({
        error: `Rate limit exceeded. Please wait ${rateLimitState.retryAfter} seconds.`,
        isProcessing: false
      });
      return null;
    }

    try {
      updateState({ isProcessing: true, error: null });
      
      // Increment request count
      setRateLimitState(prev => ({
        ...prev,
        requestCount: prev.requestCount + 1
      }));

      const response = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          audio,
          format: 'webm',
          language: 'en',
          context: state.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          })),
          interviewConfig: {
            type: interviewType,
            questions,
            currentIndex: state.currentQuestionIndex
          },
          provider: providers
        })
      });

      const data = await response.json();
      
      // Handle rate limit responses
      if (response.status === 429) {
        const retryAfter = data.retryAfter || 60;
        setRateLimitState(prev => ({
          ...prev,
          isRateLimited: true,
          retryAfter,
          failedAttempts: prev.failedAttempts + 1,
          providerStatus: data.providerStatus || []
        }));
        
        updateState({
          error: `Rate limit exceeded. ${data.suggestion || `Try again in ${retryAfter} seconds.`}`,
          isProcessing: false
        });
        
        // Auto-retry with exponential backoff if enabled
        if (rateLimiting.enabled && attempt < rateLimiting.maxRetries) {
          const backoffDelay = Math.min(
            rateLimiting.baseDelay * Math.pow(2, attempt - 1),
            rateLimiting.maxDelay
          );
          
          console.log(`🔄 Auto-retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${rateLimiting.maxRetries})`);
          
          setTimeout(() => {
            makeVoicePipelineRequest(audio, action, attempt + 1);
          }, backoffDelay);
        }
        
        return null;
      }

      // Handle other errors
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Pipeline request failed');
      }

      // Reset failed attempts on success
      setRateLimitState(prev => ({
        ...prev,
        failedAttempts: 0,
        providerStatus: data.providerStatus || []
      }));

      return data;
    } catch (error: any) {
      console.error('Pipeline request error:', error);
      
      setRateLimitState(prev => ({
        ...prev,
        failedAttempts: prev.failedAttempts + 1
      }));

      // Auto-retry on network errors if enabled
      if (rateLimiting.enabled && 
          attempt < rateLimiting.maxRetries && 
          (error.name === 'TypeError' || error.message.includes('fetch'))) {
        
        const backoffDelay = Math.min(
          rateLimiting.baseDelay * Math.pow(2, attempt - 1),
          rateLimiting.maxDelay
        );
        
        console.log(`🔄 Network error, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${rateLimiting.maxRetries})`);
        
        setTimeout(() => {
          makeVoicePipelineRequest(audio, action, attempt + 1);
        }, backoffDelay);
        
        return null;
      }

      updateState({
        error: error.message || 'Voice pipeline request failed',
        isProcessing: false
      });
      return null;
    }
  }, [checkRateLimit, rateLimitState, state.messages, interviewType, questions, state.currentQuestionIndex, providers, updateState, rateLimiting]);

  // Enhanced processAudio with better error handling
  const processAudio = useCallback(async (audioBlob: Blob) => {
    if (rateLimitState.isRateLimited) {
      updateState({
        error: `Rate limit active. Please wait ${rateLimitState.retryAfter} seconds before trying again.`
      });
      return;
    }

    try {
      updateState({ isProcessing: true, error: null });
      
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const result = await makeVoicePipelineRequest(base64Audio, 'pipeline');
      
      if (result) {
        // Add user message
        const userMessage: VoiceMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: result.transcript || '',
          timestamp: Date.now(),
          metadata: {
            provider: result.provider,
            confidence: result.confidence,
            processingTime: result.metadata?.processingTime
          }
        };
        
        // Add assistant response
        const assistantMessage: VoiceMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.response || '',
          timestamp: Date.now(),
          audioUrl: result.audioUrl,
          metadata: {
            provider: result.metadata?.tts?.provider,
            processingTime: result.metadata?.processingTime
          }
        };
        
        updateState({
          messages: [...state.messages, userMessage, assistantMessage],
          transcript: result.transcript || '',
          response: result.response || '',
          isProcessing: false
        });
        
        // Play response audio if available
        if (result.audioUrl) {
          await playAudio(result.audioUrl);
        }
      }
    } catch (error: any) {
      console.error('Audio processing error:', error);
      updateState({
        error: error.message || 'Failed to process audio',
        isProcessing: false
      });
    }
  }, [rateLimitState, makeVoicePipelineRequest, state.messages, updateState]);

  // Retry last request function
  const retryLastRequest = useCallback(async () => {
    if (!lastRequestRef.current) {
      updateState({ error: 'No request to retry' });
      return;
    }

    const { audio, action } = lastRequestRef.current;
    await makeVoicePipelineRequest(audio, action as any);
  }, [makeVoicePipelineRequest, updateState]);

  // Rate limit countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (rateLimitState.isRateLimited && rateLimitState.retryAfter > 0) {
      interval = setInterval(() => {
        setRateLimitState(prev => {
          const newRetryAfter = prev.retryAfter - 1;
          if (newRetryAfter <= 0) {
            return { ...prev, isRateLimited: false, retryAfter: 0 };
          }
          return { ...prev, retryAfter: newRetryAfter };
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rateLimitState.isRateLimited, rateLimitState.retryAfter]);

  // Auto-clear errors after 10 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        updateState({ error: null });
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [state.error, updateState]);

  // Play audio utility function
  const playAudio = useCallback(async (audioUrl: string): Promise<void> => {
    try {
      updateState({ isSpeaking: true });
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        updateState({ isSpeaking: false });
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        updateState({ isSpeaking: false, error: 'Failed to play audio' });
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      updateState({ isSpeaking: false, error: 'Failed to play audio' });
    }
  }, [updateState]);

  // Speech synthesis utility function
  const synthesizeSpeech = useCallback(async (text: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tts',
          text,
          voice: 'nova',
          provider: providers?.tts || 'openai'
        })
      });

      const result = await response.json();
      
      if (result.success && result.audio) {
        // Convert base64 audio to blob URL
        const audioBuffer = Uint8Array.from(atob(result.audio), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBuffer], { type: `audio/${result.format || 'mp3'}` });
        return URL.createObjectURL(audioBlob);
      }
      
      return null;
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      return null;
    }
  }, [providers?.tts]);

  // Initialize audio system
  const initializeAudio = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      mediaStreamRef.current = stream;
      
      // Setup audio analysis
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      updateState({ connectionStatus: 'connected' });
      return stream;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      updateState({ 
        error: 'Failed to access microphone. Please check permissions.',
        connectionStatus: 'error'
      });
      throw error;
    }
  }, [updateState]);

  // Audio level monitoring with enhanced VAD
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const level = rms / 255;

    updateState({ audioLevel: level });

    // Enhanced Voice Activity Detection
    const isSpeaking = level > vadThreshold;
    
    if (state.isListening && !state.isRecording && isSpeaking && !state.isSpeaking) {
      startRecording();
    } else if (state.isRecording && !isSpeaking) {
      // Start silence timer
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          stopRecording();
        }, silenceTimeout);
      }
    } else if (state.isRecording && isSpeaking && silenceTimerRef.current) {
      // Cancel silence timer if speaking again
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, [vadThreshold, silenceTimeout, state.isListening, state.isRecording, state.isSpeaking, updateState]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!mediaStreamRef.current || state.isRecording || state.isSpeaking) return;

    try {
      const mediaRecorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processRecording();
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      
      updateState({ isRecording: true });

      // Auto-stop after max recording time
      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, maxRecordingTime);

      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      updateState({ error: 'Failed to start recording' });
    }
  }, [state.isRecording, state.isSpeaking, maxRecordingTime, updateState]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      
      updateState({ isRecording: false });

      // Clear timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      console.log('🎤 Recording stopped');
    }
  }, [state.isRecording, updateState]);

  // Process recording through pipeline
  const processRecording = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      updateState({ isProcessing: true });

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await processAudio(audioBlob);

    } catch (error) {
      console.error('Failed to process recording:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Processing failed',
        isProcessing: false
      });
    }
  }, [processAudio, updateState]);

  // Send text message (for testing or fallback)
  const sendMessage = useCallback(async (text: string) => {
    try {
      updateState({ isProcessing: true, transcript: text });

      const response = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'llm',
          message: text,
          context: state.messages,
          interviewConfig: questions.length > 0 ? {
            type: interviewType,
            questions,
            currentIndex: state.currentQuestionIndex
          } : undefined
        })
      });

      const llmResult = await response.json();

      if (llmResult.success) {
        // Generate TTS for response
        const audioUrl = await synthesizeSpeech(llmResult.response);

        if (audioUrl) {
          await playAudio(audioUrl);
        }

        // Update state
        const userMessage: VoiceMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: text,
          timestamp: Date.now()
        };

        const assistantMessage: VoiceMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: llmResult.response,
          timestamp: Date.now(),
          audioUrl: audioUrl || undefined
        };

        updateState({
          response: llmResult.response,
          messages: [...state.messages, userMessage, assistantMessage],
          currentQuestionIndex: state.currentQuestionIndex + (llmResult.nextQuestion ? 1 : 0),
          isComplete: llmResult.isComplete || false,
          isProcessing: false
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Message sending failed',
        isProcessing: false
      });
    }
  }, [state.messages, state.currentQuestionIndex, interviewType, questions, updateState, synthesizeSpeech, playAudio]);

  // Public actions
  const startListening = useCallback(async () => {
    try {
      updateState({ connectionStatus: 'connecting' });
      await initializeAudio();
      updateState({ isListening: true });
      
      // Start audio monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      monitorAudioLevel();
    } catch (error) {
      updateState({ error: 'Failed to start listening' });
    }
  }, [initializeAudio, monitorAudioLevel, updateState]);

  const stopListening = useCallback(async () => {
    // Stop recording if active
    if (state.isRecording) {
      stopRecording();
    }

    // Stop audio monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop current audio playback
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    updateState({ 
      isListening: false, 
      isRecording: false,
      isSpeaking: false,
      audioLevel: 0,
      connectionStatus: 'disconnected'
    });
  }, [state.isRecording, stopRecording, updateState]);

  const pushToTalk = useCallback(() => {
    if (!state.isListening || state.isSpeaking || state.isProcessing) return;
    startRecording();
  }, [state.isListening, state.isSpeaking, state.isProcessing, startRecording]);

  const releasePushToTalk = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    }
  }, [state.isRecording, stopRecording]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const resetConversation = useCallback(() => {
    // Stop current activities
    if (state.isRecording) {
      stopRecording();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Reset rate limiting
    setRateLimitState(prev => ({
      ...prev,
      isRateLimited: false,
      retryAfter: 0,
      failedAttempts: 0
    }));

    updateState({
      messages: [],
      transcript: '',
      response: '',
      currentQuestionIndex: 0,
      isComplete: false,
      error: null,
      isProcessing: false,
      isSpeaking: false
    });
  }, [state.isRecording, stopRecording, updateState]);

  // Computed values
  const canStartListening = !state.isListening && 
    !state.isProcessing && 
    state.connectionStatus !== 'connecting' &&
    !rateLimitState.isRateLimited;
    
  const isActive = state.isListening || 
    state.isRecording || 
    state.isProcessing || 
    state.isSpeaking;
  
  const canMakeRequest = !rateLimitState.isRateLimited && 
    rateLimitState.failedAttempts < rateLimiting.maxRetries;
  
  const progress = questions.length > 0 ? {
    current: state.currentQuestionIndex,
    total: questions.length,
    percentage: Math.round((state.currentQuestionIndex / questions.length) * 100)
  } : undefined;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Auto-start with first question
  useEffect(() => {
    if (state.isListening && questions.length > 0 && state.messages.length === 0 && !state.isComplete) {
      // Send initial question
      const initialQuestion = questions[0];
      if (initialQuestion) {
        sendMessage(`Let's start the interview. ${initialQuestion}`);
      }
    }
  }, [state.isListening, questions, state.messages.length, state.isComplete, sendMessage]);

  return {
    // State
    ...state,
    
    // Rate limiting state
    rateLimitState,
    canMakeRequest,
    
    // Actions
    startListening,
    stopListening,
    pushToTalk,
    releasePushToTalk,
    clearError,
    resetConversation,
    sendMessage,
    retryLastRequest,
    
    // Computed
    canStartListening,
    isActive,
    progress
  };
}

// Enhanced utility hooks
export function useVoicePermissions() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkPermissions = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setHasPermission(result.state === 'granted');
      
      result.addEventListener('change', () => {
        setHasPermission(result.state === 'granted');
      });
    } catch (error) {
      console.error('Failed to check microphone permissions:', error);
      setHasPermission(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (error) {
      console.error('Failed to request microphone permissions:', error);
      setHasPermission(false);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    hasPermission,
    isChecking,
    requestPermissions,
    checkPermissions
  };
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const refreshDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === 'audioinput');
      setDevices(audioInputs);
      
      if (audioInputs.length > 0 && !selectedDevice) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    refreshDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  return {
    devices,
    selectedDevice,
    setSelectedDevice,
    isLoading,
    refreshDevices
  };
}