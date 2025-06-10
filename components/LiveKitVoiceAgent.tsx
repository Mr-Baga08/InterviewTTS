// components/LiveKitVoiceAgent.tsx - Fixed API Usage
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Room, 
  RoomEvent, 
  RemoteAudioTrack, 
  LocalAudioTrack,
  Track,
  TrackPublication,
  Participant,
  ConnectionState,
  DisconnectReason
} from 'livekit-client';

interface LiveKitVoiceAgentProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: 'generate' | 'interview';
  questions?: string[];
  interviewType?: 'technical' | 'behavioral' | 'mixed';
  className?: string;
}

const LiveKitVoiceAgent: React.FC<LiveKitVoiceAgentProps> = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions = [],
  interviewType = 'mixed',
  className
}) => {
  const router = useRouter();
  const [room] = useState(() => new Room());
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [error, setError] = useState<string | null>(null);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);

  // Setup room events
  useEffect(() => {
    const handleConnected = () => {
      console.log('✅ Connected to room');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      setConnectionState(ConnectionState.Connected);
    };

    const handleDisconnected = (reason?: DisconnectReason) => {
      console.log('❌ Disconnected from room:', reason);
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionState(ConnectionState.Disconnected);
    };

    const handleReconnecting = () => {
      console.log('🔄 Reconnecting to room');
      setIsConnecting(true);
      setConnectionState(ConnectionState.Reconnecting);
    };

    const handleReconnected = () => {
      console.log('✅ Reconnected to room');
      setIsConnecting(false);
      setConnectionState(ConnectionState.Connected);
    };

    const handleConnectionStateChanged = (state: ConnectionState) => {
      console.log('📶 Connection state changed:', state);
      setConnectionState(state);
      setIsConnecting(state === ConnectionState.Connecting || state === ConnectionState.Reconnecting);
      setIsConnected(state === ConnectionState.Connected);
    };

    const handleTrackSubscribed = (
      track: RemoteAudioTrack, 
      publication: TrackPublication, 
      participant: Participant
    ) => {
      console.log('🤖 Remote track subscribed:', track.kind, participant.identity);
      
      if (track.kind === Track.Kind.Audio && participant.identity === 'interview-agent') {
        console.log('🤖 Agent audio track subscribed');
        setAgentSpeaking(true);
        
        // Attach audio track to play agent's voice
        const audioElement = track.attach() as HTMLAudioElement;
        audioElement.autoplay = true;
        
        // Monitor audio for speaking detection
        track.on('muted', () => setAgentSpeaking(false));
        track.on('unmuted', () => setAgentSpeaking(true));
      }
    };

    const handleTrackUnsubscribed = (
      track: RemoteAudioTrack,
      publication: TrackPublication,
      participant: Participant
    ) => {
      if (track.kind === Track.Kind.Audio && participant.identity === 'interview-agent') {
        console.log('🤖 Agent audio track unsubscribed');
        setAgentSpeaking(false);
        track.detach();
      }
    };

    const handleDataReceived = (
      payload: Uint8Array,
      participant?: Participant,
      kind?: any
    ) => {
      if (participant?.identity === 'interview-agent') {
        try {
          const message = JSON.parse(new TextDecoder().decode(payload));
          console.log('📨 Received data from agent:', message);
          
          if (message.type === 'transcript') {
            setTranscript(message.text);
          }
        } catch (error) {
          console.error('Error parsing agent data:', error);
        }
      }
    };

    const handleParticipantConnected = (participant: Participant) => {
      console.log('👤 Participant connected:', participant.identity);
    };

    const handleParticipantDisconnected = (participant: Participant) => {
      console.log('👤 Participant disconnected:', participant.identity);
    };

    // Add event listeners with proper types
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    return () => {
      // Cleanup event listeners
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room]);

  // Monitor local audio for user speaking detection
  useEffect(() => {
    if (!localAudioTrack) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrame: number;

    const setupAudioAnalysis = async () => {
      try {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        // Get the MediaStreamTrack from the LocalAudioTrack
        const mediaStream = new MediaStream([localAudioTrack.mediaStreamTrack]);
        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
          if (!analyser) return;
          
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate RMS
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const volume = rms / 255;

          // Update speaking state based on volume threshold
          setUserSpeaking(volume > 0.01);

          animationFrame = requestAnimationFrame(checkAudioLevel);
        };

        checkAudioLevel();
      } catch (error) {
        console.error('Failed to setup audio analysis:', error);
      }
    };

    setupAudioAnalysis();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [localAudioTrack]);

  const handleStart = useCallback(async () => {
    if (isConnecting || isConnected) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Generate room name
      const roomName = `interview-${interviewId || Date.now()}`;

      // Prepare interview configuration
      const interviewConfig = {
        interviewId,
        userId,
        userName,
        questions,
        interviewType,
        type,
      };

      console.log('🚀 Starting LiveKit session...');

      // Get tokens and start agent (if using agent API)
      const response = await fetch('/api/livekit/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          participantName: userName,
          interviewConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const { participantToken, url } = await response.json();

      // Connect to the room
      await room.connect(url, participantToken);

      // Create and publish local audio track with correct API
      try {
        const audioTrack = await LocalAudioTrack.create({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        });

        await room.localParticipant.publishTrack(audioTrack, {
          name: 'user-audio',
          source: Track.Source.Microphone,
        });

        setLocalAudioTrack(audioTrack);
        console.log('✅ Local audio track published');
      } catch (audioError) {
        console.error('❌ Failed to setup audio:', audioError);
        setError('Failed to access microphone. Please check permissions.');
        return;
      }

      console.log('✅ Interview session started');

    } catch (error) {
      console.error('❌ Failed to start session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start session');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, interviewId, userId, userName, questions, interviewType, type, room]);

  const handleStop = useCallback(async () => {
    try {
      // Stop local audio track
      if (localAudioTrack) {
        localAudioTrack.stop();
        setLocalAudioTrack(null);
      }

      // Disconnect from room
      await room.disconnect();
      
      // Navigate based on type
      if (type === 'interview' && interviewId) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('❌ Error stopping session:', error);
    }
  }, [room, localAudioTrack, type, interviewId, router]);

  const getConnectionStatusDisplay = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return { text: 'Connected', color: 'text-green-400', bg: 'bg-green-500/20' };
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return { text: 'Connecting...', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
      case ConnectionState.Disconnected:
        return { text: 'Disconnected', color: 'text-gray-400', bg: 'bg-gray-500/20' };
      default:
        return { text: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/20' };
    }
  };

  const status = getConnectionStatusDisplay();

  return (
    <div className={cn('voice-agent-container', className)}>
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Connection Error</span>
          </div>
          <p className="text-sm text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Voice Agent Interface */}
      <div className="apple-glass rounded-3xl p-8">
        {/* Avatar Section */}
        <div className="flex justify-center items-center gap-8 mb-8">
          {/* AI Avatar */}
          <div className="text-center">
            <div className={cn(
              'relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300',
              agentSpeaking ? 'border-green-400 shadow-lg shadow-green-400/30' : 'border-white/20'
            )}>
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              {agentSpeaking && (
                <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping" />
              )}
            </div>
            <p className="text-white/80 font-medium mt-2">AI Interviewer</p>
          </div>

          {/* User Avatar */}
          <div className="text-center">
            <div className={cn(
              'relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300',
              userSpeaking ? 'border-blue-400 shadow-lg shadow-blue-400/30' : 'border-white/20'
            )}>
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {userSpeaking && (
                <div className="absolute inset-0 border-4 border-blue-400 rounded-full animate-ping" />
              )}
            </div>
            <p className="text-white/80 font-medium mt-2">{userName}</p>
          </div>
        </div>

        {/* Status Display */}
        <div className="flex justify-center mb-6">
          <div className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-300',
            status.bg
          )}>
            <div className={cn('w-2 h-2 rounded-full animate-pulse', status.color.replace('text-', 'bg-'))} />
            <span className={cn('text-sm font-medium', status.color)}>{status.text}</span>
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-white/90 leading-relaxed">
              {transcript}
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {!isConnected ? (
            <button
              onClick={handleStart}
              disabled={isConnecting}
              className={cn(
                'flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300',
                !isConnecting ? 
                  'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105' :
                  'bg-gray-500/20 text-gray-400 cursor-not-allowed'
              )}
            >
              {isConnecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1" />
                  </svg>
                  <span>
                    {type === 'interview' ? 'Start Interview' : 'Start Conversation'}
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
              <span>End Session</span>
            </button>
          )}
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-black/30 rounded-lg text-xs text-white/50">
            <p>Debug: Connection State = {connectionState}</p>
            <p>Room State = {room.state}</p>
            <p>Participants = {room.remoteParticipants.size}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveKitVoiceAgent;