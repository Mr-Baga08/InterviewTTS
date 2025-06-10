// components/LiveKitVoiceAgent.tsx (Updated)
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Room, RoomEvent, RemoteAudioTrack, LocalAudioTrack } from 'livekit-client';
import { cn } from '@/lib/utils';

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
  const [error, setError] = useState<string | null>(null);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>('');

  // Setup room events
  useEffect(() => {
    const handleConnected = () => {
      console.log('✅ Connected to room');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };

    const handleDisconnected = () => {
      console.log('❌ Disconnected from room');
      setIsConnected(false);
      setIsConnecting(false);
    };

    const handleReconnecting = () => {
      console.log('🔄 Reconnecting to room');
      setIsConnecting(true);
    };

    const handleReconnected = () => {
      console.log('✅ Reconnected to room');
      setIsConnecting(false);
    };

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      if (track instanceof RemoteAudioTrack && participant.identity === 'interview-agent') {
        console.log('🤖 Agent audio track subscribed');
        setAgentSpeaking(true);
        
        // Auto-play agent audio
        track.attach();
      }
    };

    const handleTrackUnsubscribed = (track: any, publication: any, participant: any) => {
      if (track instanceof RemoteAudioTrack && participant.identity === 'interview-agent') {
        setAgentSpeaking(false);
      }
    };

    const handleDataReceived = (payload: Uint8Array, participant: any) => {
      if (participant?.identity === 'interview-agent') {
        try {
          const message = JSON.parse(new TextDecoder().decode(payload));
          if (message.type === 'transcript') {
            setTranscript(message.text);
          }
        } catch (error) {
          console.error('Error parsing agent data:', error);
        }
      }
    };

    // Add event listeners
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    room.on(RoomEvent.Reconnecting, handleReconnecting);
    room.on(RoomEvent.Reconnected, handleReconnected);
    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
      room.off(RoomEvent.Reconnecting, handleReconnecting);
      room.off(RoomEvent.Reconnected, handleReconnected);
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

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

      // Get tokens and start agent
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

      // Enable local audio
      const audioTrack = await LocalAudioTrack.createAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      await room.localParticipant.publishTrack(audioTrack);

      console.log('✅ Interview session started');

    } catch (error) {
      console.error('❌ Failed to start session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start session');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, interviewId, userId, userName, questions, interviewType, type, room]);

  const handleStop = useCallback(async () => {
    try {
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
  }, [room, type, interviewId, router]);

  // Monitor audio levels for speaking detection
  useEffect(() => {
    if (!isConnected) return;

    let rafId: number;

    const monitorAudio = () => {
      // This is a simplified version - you'd want to implement proper audio level monitoring
      const audioTracks = Array.from(room.localParticipant.audioTrackPublications.values())
        .map(pub => pub.track)
        .filter(track => track && track.source.state === 'enabled');

      const isCurrentlySpeaking = audioTracks.length > 0; // Simplified detection
      setUserSpeaking(isCurrentlySpeaking);

      rafId = requestAnimationFrame(monitorAudio);
    };

    monitorAudio();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isConnected, room]);

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

        {/* Status Indicators */}
        <div className="flex justify-center gap-4 mb-6">
          <div className={cn(
            'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
            isConnected ? 'bg-green-500/20 text-green-400' :
            isConnecting ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-500/20 text-gray-400'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-green-400 animate-pulse' :
              isConnecting ? 'bg-yellow-400 animate-pulse' :
              'bg-gray-400'
            )} />
            <span className="capitalize">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Disconnected'}
            </span>
          </div>

          {questions.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
              <span>{questions.length} Questions</span>
            </div>
          )}
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
      </div>
    </div>
  );
};

export default LiveKitVoiceAgent;