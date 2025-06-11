import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Room,
  RoomEvent,
  LocalAudioTrack,
  Track,
  // Corrected imports for track publication and participant
  RemoteTrackPublication,
  RemoteParticipant,
  DataPacket_Kind,
  ConnectionState,
  DisconnectReason,
  AudioCaptureOptions,
  // Import the function to create a local audio track
  createLocalAudioTrack,
  RemoteTrack,
} from 'livekit-client';

interface LiveKitVoiceAssistantProps {
  userName: string;
  userId: string;
  interviewId?: string;
  questions?: string[];
  interviewType?: 'technical' | 'behavioral' | 'mixed';
  onTranscriptReceived?: (transcript: string, isFinal: boolean) => void;
  onResponseReceived?: (response: string) => void;
  onError?: (error: string) => void;
}

interface AudioLevelData {
  level: number;
  speaking: boolean;
}

const LiveKitVoiceAssistant: React.FC<LiveKitVoiceAssistantProps> = ({
  userName,
  userId,
  interviewId,
  questions = [],
  interviewType = 'mixed',
  onTranscriptReceived,
  onResponseReceived,
  onError,
}) => {
  // State Management
  const [room] = useState(() => new Room());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [error, setError] = useState<string | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<LocalAudioTrack | null>(null);

  // Audio Analysis
  const [userAudioLevel, setUserAudioLevel] = useState<AudioLevelData>({
    level: 0,
    speaking: false,
  });
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);

  // Conversation State
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: number;
    }>
  >([]);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Level Monitoring
  const setupAudioAnalysis = useCallback(
    async (track: LocalAudioTrack) => {
      try {
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        const mediaStream = new MediaStream([track.mediaStreamTrack]);
        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateAudioLevel = () => {
          if (!analyser || audioContext.state === 'closed') return;

          analyser.getByteFrequencyData(dataArray);

          // Calculate RMS
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const level = rms / 255;
          const speaking = level > 0.01;

          setUserAudioLevel({ level, speaking });

          // Voice Activity Detection
          if (!isPushToTalk && speaking && !isRecording) {
            startRecording();
          } else if (!isPushToTalk && !speaking && isRecording) {
            // Stop recording after 1.5 seconds of silence
            if (recordingTimeoutRef.current) {
              clearTimeout(recordingTimeoutRef.current);
            }
            recordingTimeoutRef.current = setTimeout(() => {
              stopRecording();
            }, 1500);
          }

          requestAnimationFrame(updateAudioLevel);
        };

        updateAudioLevel();
      } catch (error) {
        console.error('Failed to setup audio analysis:', error);
      }
    },
    [isPushToTalk, isRecording]
  );

  // Recording Management
  const startRecording = useCallback(() => {
    if (!localAudioTrack || isRecording) return;

    try {
      const mediaStream = new MediaStream([localAudioTrack.mediaStreamTrack]);
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'audio/webm;codecs=opus',
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

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.('Failed to start recording');
    }
  }, [localAudioTrack, isRecording, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);

      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      console.log('🎤 Recording stopped');
    }
  }, [isRecording]);

  const processRecording = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: 'audio/webm',
      });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      // Send to STT
      const sttResponse = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64Audio,
          format: 'webm',
          language: 'en',
        }),
      });

      const sttResult = await sttResponse.json();

      if (sttResult.success && sttResult.transcript?.trim()) {
        const transcript = sttResult.transcript.trim();
        setTranscript(transcript);
        onTranscriptReceived?.(transcript, true);

        // Add to messages
        const userMessage = {
          id: `user-${Date.now()}`,
          role: 'user' as const,
          content: transcript,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMessage]);

        // Send to LLM
        await processWithLLM(transcript);
      }
    } catch (error) {
      console.error('Failed to process recording:', error);
      onError?.('Failed to process audio');
    }
  }, [onTranscriptReceived, onError]);

  const processWithLLM = useCallback(
    async (userMessage: string) => {
      try {
        const llmResponse = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            context: messages,
            interviewType,
            questions,
            currentQuestionIndex: messages.filter(
              (m) => m.role === 'assistant'
            ).length,
          }),
        });

        const llmResult = await llmResponse.json();

        if (llmResult.success && llmResult.response) {
          const response = llmResult.response;
          setAiResponse(response);
          onResponseReceived?.(response);

          // Add AI response to messages
          const assistantMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant' as const,
            content: response,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // Convert to speech
          await processWithTTS(response);
        }
      } catch (error) {
        console.error('Failed to process with LLM:', error);
        onError?.('Failed to generate response');
      }
    },
    [messages, interviewType, questions, onResponseReceived, onError]
  );

  const processWithTTS = useCallback(
    async (text: string) => {
      try {
        setAgentSpeaking(true);

        const ttsResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voice: 'nova',
            provider: 'openai',
            format: 'mp3',
          }),
        });

        const ttsResult = await ttsResponse.json();

        if (ttsResult.success && ttsResult.audio) {
          // Play audio
          const audioBuffer = Uint8Array.from(atob(ttsResult.audio), (c) =>
            c.charCodeAt(0)
          );
          const audioBlob = new Blob([audioBuffer], {
            type: `audio/${ttsResult.format}`,
          });
          const audioUrl = URL.createObjectURL(audioBlob);

          const audio = new Audio(audioUrl);

          audio.onended = () => {
            setAgentSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };

          audio.onerror = () => {
            setAgentSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };

          await audio.play();
        }
      } catch (error) {
        console.error('Failed to process with TTS:', error);
        setAgentSpeaking(false);
        onError?.('Failed to generate speech');
      }
    },
    [onError]
  );

  // Push-to-Talk handlers
  const handlePushToTalkStart = useCallback(() => {
    if (isPushToTalk && !agentSpeaking) {
      startRecording();
    }
  }, [isPushToTalk, agentSpeaking, startRecording]);

  const handlePushToTalkEnd = useCallback(() => {
    if (isPushToTalk) {
      stopRecording();
    }
  }, [isPushToTalk, stopRecording]);

  // LiveKit Room Events
  useEffect(() => {
    const handleConnected = () => {
      console.log('✅ Connected to LiveKit room');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    const handleDisconnected = (reason?: DisconnectReason) => {
      console.log('❌ Disconnected from room:', reason);
      setIsConnected(false);
      setIsConnecting(false);
    };

    const handleConnectionStateChanged = (state: ConnectionState) => {
      console.log('📶 Connection state:', state);
      setConnectionState(state);
      setIsConnecting(
        state === ConnectionState.Connecting ||
          state === ConnectionState.Reconnecting
      );
      setIsConnected(state === ConnectionState.Connected);
    };

    // FIX: Corrected the signature of the event handler.
    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      // FIX: Check if the subscribed track is an audio track.
      if (track.kind === Track.Kind.Audio) {
        console.log('🔊 Remote audio track subscribed');
        const audioElement = track.attach() as HTMLAudioElement;
        audioElement.autoplay = true;
      }
    };

    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);

    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(
        RoomEvent.ConnectionStateChanged,
        handleConnectionStateChanged
      );
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    };
  }, [room]);

  // Connect to room
  const handleConnect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Get LiveKit token
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `interview-${interviewId || Date.now()}`,
          participantName: userName,
          metadata: { userId, interviewType },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get LiveKit token');
      }

      const { token, url } = await response.json();

      // Connect to room
      await room.connect(url, token);

      // FIX: Use createLocalAudioTrack to create the audio track.
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        channelCount: 1,
      } as AudioCaptureOptions);

      await room.localParticipant.publishTrack(audioTrack, {
        name: 'user-audio',
        source: Track.Source.Microphone,
      });

      setLocalAudioTrack(audioTrack);

      // Setup audio analysis
      await setupAudioAnalysis(audioTrack);

      console.log('✅ Successfully connected and published audio');
    } catch (error) {
      console.error('❌ Failed to connect:', error);
      setError(
        error instanceof Error ? error.message : 'Connection failed'
      );
      setIsConnecting(false);
    }
  }, [
    isConnecting,
    isConnected,
    interviewId,
    userName,
    userId,
    interviewType,
    room,
    setupAudioAnalysis,
  ]);

  // Disconnect from room
  const handleDisconnect = useCallback(async () => {
    try {
      // Stop recording
      if (isRecording) {
        stopRecording();
      }

      // Stop audio analysis
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop local audio track
      if (localAudioTrack) {
        localAudioTrack.stop();
        setLocalAudioTrack(null);
      }

      // Disconnect from room
      await room.disconnect();

      setIsConnected(false);
      setIsConnecting(false);
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }, [room, localAudioTrack, isRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, [handleDisconnect]);

  const getStatusDisplay = () => {
    if (error)
      return {
        text: 'Error',
        color: 'text-red-400',
        bg: 'bg-red-500/20',
      };
    if (agentSpeaking)
      return {
        text: 'AI Speaking',
        color: 'text-green-400',
        bg: 'bg-green-500/20',
      };
    if (isRecording)
      return {
        text: 'Recording',
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
      };
    if (userAudioLevel.speaking)
      return {
        text: 'Listening',
        color: 'text-purple-400',
        bg: 'bg-purple-500/20',
      };
    if (isConnected)
      return { text: 'Ready', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    if (isConnecting)
      return {
        text: 'Connecting...',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
      };
    return {
      text: 'Disconnected',
      color: 'text-gray-500',
      bg: 'bg-gray-600/20',
    };
  };

  const status = getStatusDisplay();

  return (
    <div className="voice-assistant-container max-w-4xl mx-auto p-6">
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-red-400">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Error</span>
          </div>
          <p className="text-sm text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Main Interface */}
      <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            AI Voice Assistant
          </h2>
          <p className="text-white/70">
            Real-time conversation with LiveKit
          </p>
        </div>

        {/* Audio Visualizer */}
        <div className="flex justify-center items-center gap-8 mb-8">
          {/* User Avatar with Audio Level */}
          <div className="text-center">
            <div
              className={`relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300 ${
                userAudioLevel.speaking
                  ? 'border-blue-400 shadow-lg shadow-blue-400/30'
                  : 'border-white/20'
              }`}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              {/* Audio level indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-blue-400 transition-all duration-100"
                  style={{ width: `${userAudioLevel.level * 100}%` }}
                />
              </div>
            </div>
            <p className="text-white/80 font-medium mt-2">{userName}</p>
          </div>

          {/* AI Avatar */}
          <div className="text-center">
            <div
              className={`relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300 ${
                agentSpeaking
                  ? 'border-green-400 shadow-lg shadow-green-400/30'
                  : 'border-white/20'
              }`}
            >
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              {agentSpeaking && (
                <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping" />
              )}
            </div>
            <p className="text-white/80 font-medium mt-2">AI Assistant</p>
          </div>
        </div>

        {/* Status Display */}
        <div className="flex justify-center mb-6">
          <div
            className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300 ${status.bg}`}
          >
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${status.color.replace(
                'text-',
                'bg-'
              )}`}
            />
            <span className={`text-sm font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setIsPushToTalk(false)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                !isPushToTalk
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Auto Mode
            </button>
            <button
              onClick={() => setIsPushToTalk(true)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isPushToTalk
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80'
              }`}
            >
              Push to Talk
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                !isConnecting
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isConnecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <span>Start Conversation</span>
                </>
              )}
            </button>
          ) : (
            <>
              {isPushToTalk && (
                <button
                  onMouseDown={handlePushToTalkStart}
                  onMouseUp={handlePushToTalkEnd}
                  onTouchStart={handlePushToTalkStart}
                  onTouchEnd={handlePushToTalkEnd}
                  disabled={agentSpeaking}
                  className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 select-none ${
                    isRecording
                      ? 'bg-red-600 text-white shadow-lg scale-105'
                      : agentSpeaking
                      ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <span>
                    {isRecording ? 'Recording...' : 'Hold to Talk'}
                  </span>
                </button>
              )}

              <button
                onClick={handleDisconnect}
                className="flex items-center gap-3 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span>Disconnect</span>
              </button>
            </>
          )}
        </div>

        {/* Conversation Display */}
        {(transcript || aiResponse) && (
          <div className="space-y-4">
            {transcript && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-blue-400">
                    You said:
                  </span>
                </div>
                <p className="text-white/90">{transcript}</p>
              </div>
            )}

            {aiResponse && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-green-400">
                    AI Assistant:
                  </span>
                </div>
                <p className="text-white/90">{aiResponse}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveKitVoiceAssistant;