// components/LiveKitVoiceAgent.tsx - React Component for LiveKit Voice Agent
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

import { 
  LiveKitVoicePipeline, 
  PipelineFactory 
} from '@/lib/livekit/pipeline';
import { 
  VoiceMessage, 
  PipelineState, 
  InterviewSession 
} from '@/types/livekit';
import { createFeedback } from '@/lib/actions/general.action';

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
  const pipelineRef = useRef<LiveKitVoicePipeline | null>(null);
  
  // Component State
  const [state, setState] = useState<PipelineState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    connectionStatus: 'disconnected'
  });
  
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Pipeline
  useEffect(() => {
    const initializePipeline = async () => {
      try {
        console.log('🚀 Initializing LiveKit Voice Pipeline...');
        
        // Create pipeline based on type
        if (type === 'interview' && questions.length > 0) {
          pipelineRef.current = PipelineFactory.createInterviewPipeline(
            interviewType,
            questions
          );
        } else {
          pipelineRef.current = PipelineFactory.createVoicePipeline();
        }
        
        // Setup event handlers
        setupEventHandlers();
        
        setIsInitialized(true);
        console.log('✅ Pipeline initialized successfully');
        
      } catch (err) {
        console.error('❌ Failed to initialize pipeline:', err);
        setError(err instanceof Error ? err.message : 'Initialization failed');
      }
    };
    
    initializePipeline();
    
    // Cleanup on unmount
    return () => {
      if (pipelineRef.current) {
        pipelineRef.current.disconnect();
      }
    };
  }, [type, questions, interviewType]);

  // Setup Event Handlers
  const setupEventHandlers = useCallback(() => {
    if (!pipelineRef.current) return;
    
    const pipeline = pipelineRef.current;
    
    // Connection status changes
    pipeline.on('onConnectionStatusChanged', (status) => {
      setState(prev => ({ ...prev, connectionStatus: status }));
      
      if (status === 'error') {
        setError('Connection failed. Please check your network and try again.');
      } else if (status === 'connected') {
        setError(null);
      }
    });
    
    // Message handling
    pipeline.on('onMessageReceived', (message) => {
      setMessages(prev => [...prev, message]);
      
      // Update session if available
      const currentSession = pipeline.getSession();
      if (currentSession) {
        setSession(currentSession);
      }
    });
    
    // Transcript updates
    pipeline.on('onTranscriptReceived', (transcript, isFinal) => {
      if (isFinal) {
        setCurrentTranscript('');
      } else {
        setCurrentTranscript(transcript);
      }
    });
    
    // Speech events
    pipeline.on('onSpeechStarted', () => {
      setState(prev => ({ ...prev, isListening: true }));
    });
    
    pipeline.on('onSpeechEnded', () => {
      setState(prev => ({ ...prev, isListening: false }));
    });
    
    // Error handling
    pipeline.on('onError', (error) => {
      console.error('Pipeline error:', error);
      setError(error.message);
    });
    
  }, []);

  // Start Interview/Conversation
  const handleStart = async () => {
    if (!pipelineRef.current || !isInitialized) {
      setError('Pipeline not initialized');
      return;
    }
    
    try {
      setError(null);
      
      // Generate LiveKit token
      const roomName = `interview-${interviewId || 'room'}`;
      const token = await LiveKitVoicePipeline.generateToken(roomName, userName);
      
      // Connect to LiveKit
      await pipelineRef.current.connect(token);
      
      // Start appropriate mode
      if (type === 'interview' && questions.length > 0) {
        await pipelineRef.current.startInterview(questions, interviewType);
      }
      
      console.log('✅ Voice agent started successfully');
      
    } catch (err) {
      console.error('❌ Failed to start voice agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to start');
    }
  };

  // Stop Interview/Conversation
  const handleStop = async () => {
    if (!pipelineRef.current) return;
    
    try {
      if (type === 'interview') {
        await pipelineRef.current.stopInterview();
        
        // Generate feedback if this was an interview
        if (interviewId && userId && messages.length > 0) {
          await generateInterviewFeedback();
        }
      }
      
      await pipelineRef.current.disconnect();
      
    } catch (err) {
      console.error('❌ Failed to stop voice agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop');
    }
  };

  // Generate Feedback
  const generateInterviewFeedback = async () => {
    if (!interviewId || !userId || messages.length === 0) return;
    
    try {
      console.log('🔄 Generating interview feedback...');
      
      // Convert messages to transcript format
      const transcript = messages.map(msg => ({
        id: msg.id,
        role: msg.type as 'user' | 'assistant' | 'system',
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      const result = await createFeedback({
        interviewId,
        userId,
        transcript,
        feedbackId
      });
      
      if (result.success) {
        console.log('✅ Feedback generated successfully');
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.error('❌ Failed to generate feedback:', result.message);
        router.push('/dashboard');
      }
      
    } catch (error) {
      console.error('❌ Error generating feedback:', error);
      router.push('/dashboard');
    }
  };

  // UI State Helpers
  const canStart = isInitialized && state.connectionStatus === 'disconnected';
  const isActive = state.connectionStatus === 'connected';
  const isConnecting = state.connectionStatus === 'connecting';

  // Get last message for display
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const displayText = currentTranscript || lastMessage?.content || '';

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
              state.isSpeaking ? 'border-green-400 shadow-lg shadow-green-400/30' : 'border-white/20'
            )}>
              <Image
                src="/ai-avatar.png"
                alt="AI Interviewer"
                width={96}
                height={96}
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke='%234ade80' stroke-width='2'%3E%3Cpath d='M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v1.27c.6.34 1 .99 1 1.73a2 2 0 0 1-2 2 2 2 0 0 1-2-2c0-.74.4-1.39 1-1.73V17a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1v-1a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1V8.27c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z'/%3E%3C/svg%3E";
                }}
              />
              {state.isSpeaking && (
                <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping" />
              )}
            </div>
            <p className="text-white/80 font-medium mt-2">AI Interviewer</p>
          </div>

          {/* User Avatar */}
          <div className="text-center">
            <div className={cn(
              'relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300',
              state.isListening ? 'border-blue-400 shadow-lg shadow-blue-400/30' : 'border-white/20'
            )}>
              <Image
                src="/user-avatar.png"
                alt={userName}
                width={96}
                height={96}
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                }}
              />
              {state.isListening && (
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
            state.connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
            state.connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-500/20 text-gray-400'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full',
              state.connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
              state.connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              'bg-gray-400'
            )} />
            <span className="capitalize">{state.connectionStatus}</span>
          </div>

          {session && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400">
              <span>Progress: {session.currentQuestionIndex}/{session.questions.length}</span>
            </div>
          )}
        </div>

        {/* Transcript Display */}
        {displayText && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className={cn(
              'text-white/90 leading-relaxed transition-opacity duration-300',
              currentTranscript ? 'opacity-70 italic' : 'opacity-100'
            )}>
              {currentTranscript && <span className="text-blue-400">[Speaking...] </span>}
              {displayText}
            </p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {!isActive ? (
            <button
              onClick={handleStart}
              disabled={!canStart}
              className={cn(
                'flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300',
                canStart ? 
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

        {/* Processing Indicator */}
        {state.isProcessing && (
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
              <span className="text-sm">Processing response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4 bg-black/30 rounded-xl text-xs text-white/60">
          <h4 className="font-medium text-white/80 mb-2">Debug Info</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>Connection: {state.connectionStatus}</div>
            <div>Messages: {messages.length}</div>
            <div>Listening: {state.isListening ? 'Yes' : 'No'}</div>
            <div>Speaking: {state.isSpeaking ? 'Yes' : 'No'}</div>
            <div>Processing: {state.isProcessing ? 'Yes' : 'No'}</div>
            <div>Session: {session ? 'Active' : 'None'}</div>
          </div>
          {session && (
            <div className="mt-2">
              Progress: {session.currentQuestionIndex}/{session.questions.length} 
              ({Math.round((session.currentQuestionIndex / session.questions.length) * 100)}%)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveKitVoiceAgent;