// hooks/useVoicePipeline.ts - Complete Voice Pipeline Hook
import { useState, useRef, useCallback, useEffect } from 'react';

interface VoicePipelineConfig {
  sttEndpoint?: string;
  llmEndpoint?: string;
  ttsEndpoint?: string;
  vadThreshold?: number;
  silenceTimeout?: number;
  maxRecordingTime?: number;
  interviewType?: 'technical' | 'behavioral' | 'mixed';
  questions?: string[];
  systemPrompt?: string;
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
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export function useVoicePipeline(config: VoicePipelineConfig = {}) {
  const {
    sttEndpoint = '/api/stt',
    llmEndpoint = '/api/llm',
    ttsEndpoint = '/api/tts',
    vadThreshold = 0.01,
    silenceTimeout = 2000,
    maxRecordingTime = 30000,
    interviewType,
    questions = [],
    systemPrompt
  } = config;

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
  });

  const [messages, setMessages] = useState<Message[]>([]);
  
  // Audio handling refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vadAnalyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context and setup
  const setupAudio = useCallback(async () => {
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
      
      streamRef.current = stream;
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      // Setup VAD (Voice Activity Detection)
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      vadAnalyserRef.current = analyser;

      // Setup MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        await processRecording();
      };

      return true;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: `Microphone access failed: ${error.message}` }));
      return false;
    }
  }, []);

  // Voice Activity Detection
  const checkVoiceActivity = useCallback(() => {
    if (!vadAnalyserRef.current) return false;

    const bufferLength = vadAnalyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    vadAnalyserRef.current.getByteFrequencyData(dataArray);

    // Calculate RMS (Root Mean Square) for volume level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    const volume = rms / 255; // Normalize to 0-1

    return volume > vadThreshold;
  }, [vadThreshold]);

  // Start listening for voice
  const startListening = useCallback(async () => {
    if (state.isListening) return;

    const audioSetup = await setupAudio();
    if (!audioSetup) return;

    setState(prev => ({ ...prev, isListening: true, error: null }));

    // Start VAD monitoring
    const vadInterval = setInterval(() => {
      const hasVoice = checkVoiceActivity();
      
      if (hasVoice && !state.isRecording) {
        startRecording();
      } else if (!hasVoice && state.isRecording) {
        // Start silence timer
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            stopRecording();
          }, silenceTimeout);
        }
      } else if (hasVoice && silenceTimerRef.current) {
        // Cancel silence timer if voice detected again
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }, 100);

    // Cleanup function
    return () => {
      clearInterval(vadInterval);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [state.isListening, state.isRecording, checkVoiceActivity, silenceTimeout]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current || state.isRecording) return;

    audioChunksRef.current = [];
    mediaRecorderRef.current.start();
    
    setState(prev => ({ ...prev, isRecording: true, transcript: '' }));

    // Set maximum recording time
    recordingTimerRef.current = setTimeout(() => {
      stopRecording();
    }, maxRecordingTime);
  }, [state.isRecording, maxRecordingTime]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !state.isRecording) return;

    mediaRecorderRef.current.stop();
    setState(prev => ({ ...prev, isRecording: false }));

    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, [state.isRecording]);

  // Process recorded audio
  const processRecording = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // 1. Convert audio to base64
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioBuffer = await audioBlob.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      // 2. Speech-to-Text
      const sttResponse = await fetch(sttEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audioBase64,
          format: 'webm',
          language: 'en',
          continuous: false
        }),
      });

      if (!sttResponse.ok) {
        throw new Error('Speech recognition failed');
      }

      const sttResult = await sttResponse.json();
      if (!sttResult.success || !sttResult.transcript?.trim()) {
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      const transcript = sttResult.transcript.trim();
      setState(prev => ({ ...prev, transcript }));

      // Add user message
      const userMessage: Message = {
        role: 'user',
        content: transcript,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMessage]);

      // 3. Generate LLM Response
      const llmResponse = await fetch(llmEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          context: messages,
          systemPrompt,
          interviewType,
          questions,
          currentQuestionIndex: state.currentQuestionIndex,
          temperature: 0.7,
          maxTokens: 300
        }),
      });

      if (!llmResponse.ok) {
        throw new Error('Language model processing failed');
      }

      const llmResult = await llmResponse.json();
      if (!llmResult.success) {
        throw new Error(llmResult.error || 'No response generated');
      }

      const response = llmResult.response;
      setState(prev => ({ 
        ...prev, 
        response,
        isComplete: llmResult.isComplete || false,
        currentQuestionIndex: llmResult.nextQuestion ? prev.currentQuestionIndex + 1 : prev.currentQuestionIndex
      }));

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // 4. Text-to-Speech
      await synthesizeSpeech(response);

    } catch (error: any) {
      console.error('❌ TTS Error:', error);
      setState(prev => ({ ...prev, error: `Speech synthesis failed: ${error.message}` }));
    } finally {
      setState(prev => ({ ...prev, isSpeaking: false, isProcessing: false }));
    }
  }, [ttsEndpoint]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setState(prev => ({ 
      ...prev, 
      isListening: false, 
      isRecording: false, 
      isProcessing: false 
    }));
  }, []);

  // Push-to-talk mode
  const pushToTalk = useCallback(async () => {
    if (!state.isListening) {
      await setupAudio();
    }
    startRecording();
  }, [state.isListening, setupAudio, startRecording]);

  const releasePushToTalk = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset conversation
  const resetConversation = useCallback(() => {
    setMessages([]);
    setState(prev => ({ 
      ...prev, 
      transcript: '', 
      response: '', 
      currentQuestionIndex: 0, 
      isComplete: false,
      error: null 
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    // State
    ...state,
    messages,
    
    // Actions
    startListening,
    stopListening,
    pushToTalk,
    releasePushToTalk,
    clearError,
    resetConversation,
    
    // Utils
    canStartListening: !state.isListening && !state.isProcessing,
    isActive: state.isListening || state.isRecording || state.isProcessing || state.isSpeaking,
    progress: questions.length > 0 ? {
      current: state.currentQuestionIndex,
      total: questions.length,
      percentage: Math.round((state.currentQuestionIndex / questions.length) * 100)
    } : null
  };
}

function synthesizeSpeech(response: any) {
  throw new Error('Function not implemented.');
}

