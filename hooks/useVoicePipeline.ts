// hooks/useVoicePipeline.ts - Complete Voice Pipeline Integration
import { useState, useEffect, useRef, useCallback } from 'react';

interface VoicePipelineConfig {
  interviewType?: 'technical' | 'behavioral' | 'mixed';
  questions?: string[];
  vadThreshold?: number;
  silenceTimeout?: number;
  maxRecordingTime?: number;
  providers?: {
    stt?: 'whisper' | 'deepgram';
    llm?: 'openai' | 'anthropic';
    tts?: 'openai' | 'elevenlabs' | 'coqui';
  };
}

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  audioUrl?: string;
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

interface VoicePipelineActions {
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  pushToTalk: () => void;
  releasePushToTalk: () => void;
  clearError: () => void;
  resetConversation: () => void;
  sendMessage: (text: string) => Promise<void>;
}

interface VoicePipelineReturn extends VoicePipelineState, VoicePipelineActions {
  canStartListening: boolean;
  isActive: boolean;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

export function useVoicePipeline(config: VoicePipelineConfig = {}): VoicePipelineReturn {
  // Configuration
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

  // Update state helper
  const updateState = useCallback((updates: Partial<VoicePipelineState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

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

  // Audio level monitoring
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

    // Voice Activity Detection
    const isSpeaking = level > vadThreshold;
    
    if (state.isListening && !state.isRecording && isSpeaking) {
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
  }, [vadThreshold, silenceTimeout, state.isListening, state.isRecording, updateState]);

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
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Use unified pipeline API
      const response = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pipeline',
          audio: base64Audio,
          format: 'webm',
          language: 'en',
          context: state.messages,
          interviewConfig: questions.length > 0 ? {
            type: interviewType,
            questions,
            currentIndex: state.currentQuestionIndex
          } : undefined,
          provider: providers
        })
      });

      const result = await response.json();

      if (result.success) {
        const { transcript, response: aiResponse, audio, format, nextQuestion, isComplete } = result;

        // Update transcript
        updateState({ transcript });

        // Add user message
        const userMessage: VoiceMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content: transcript,
          timestamp: Date.now()
        };

        // Add AI response
        const assistantMessage: VoiceMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: aiResponse,
          timestamp: Date.now()
        };

        // Play AI response
        await playAudioResponse(audio, format);

        updateState({
          response: aiResponse,
          messages: [...state.messages, userMessage, assistantMessage],
          currentQuestionIndex: state.currentQuestionIndex + (nextQuestion ? 1 : 0),
          isComplete: isComplete || false,
          isProcessing: false
        });

      } else {
        throw new Error(result.error || 'Pipeline processing failed');
      }
    } catch (error) {
      console.error('Failed to process recording:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Processing failed',
        isProcessing: false
      });
    }
  }, [state.messages, state.currentQuestionIndex, interviewType, questions, providers, updateState]);

  // Play audio response
  const playAudioResponse = useCallback(async (base64Audio: string, format: string): Promise<void> => {
    try {
      updateState({ isSpeaking: true });

      const audioBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBuffer], { type: `audio/${format}` });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        updateState({ isSpeaking: false });
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        updateState({ isSpeaking: false, error: 'Failed to play audio response' });
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      updateState({ isSpeaking: false, error: 'Failed to play audio response' });
    }
  }, [updateState]);

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
        const ttsResponse = await fetch('/api/voice/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'tts',
            text: llmResult.response,
            voice: 'nova',
            provider: providers?.tts || 'openai'
          })
        });

        const ttsResult = await ttsResponse.json();

        if (ttsResult.success) {
          await playAudioResponse(ttsResult.audio, ttsResult.format);
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
          timestamp: Date.now()
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
  }, [state.messages, state.currentQuestionIndex, interviewType, questions, providers, updateState, playAudioResponse]);

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
  const canStartListening = !state.isListening && !state.isProcessing && state.connectionStatus !== 'connecting';
  const isActive = state.isListening || state.isRecording || state.isProcessing || state.isSpeaking;
  
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
  }, []);

  // Auto-start with first question
  useEffect(() => {
    if (state.isListening && questions.length > 0 && state.messages.length === 0 && !state.isComplete) {
      // Send initial question
      const initialQuestion = questions[0];
      if (initialQuestion) {
        sendMessage(`Let's start the interview. ${initialQuestion}`);
      }
    }
  }, [state.isListening, questions, state.messages.length, state.isComplete]);

  return {
    // State
    ...state,
    
    // Actions
    startListening,
    stopListening,
    pushToTalk,
    releasePushToTalk,
    clearError,
    resetConversation,
    sendMessage,
    
    // Computed
    canStartListening,
    isActive,
    progress
  };
}

// Additional utility hooks
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