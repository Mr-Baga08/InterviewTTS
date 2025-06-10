// components/VoiceInterface.tsx - Complete Voice Interface
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useVoicePipeline } from '@/hooks/useVoicePipeline';

interface VoiceInterfaceProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: 'generate' | 'interview';
  questions?: string[];
  interviewType?: 'technical' | 'behavioral' | 'mixed';
  className?: string;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
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
  const [mode, setMode] = useState<'auto' | 'push'>('auto');
  const [showTranscript, setShowTranscript] = useState(true);
  
  const {
    isListening,
    isProcessing,
    isSpeaking,
    isRecording,
    error,
    transcript,
    response,
    currentQuestionIndex,
    isComplete,
    messages,
    
    startListening,
    stopListening,
    pushToTalk,
    releasePushToTalk,
    clearError,
    resetConversation,
    
    canStartListening,
    isActive,
    progress
  } = useVoicePipeline({
    interviewType,
    questions,
    vadThreshold: 0.01,
    silenceTimeout: 2000,
    maxRecordingTime: 30000
  });

  // Handle interview completion
  useEffect(() => {
    if (isComplete && type === 'interview' && interviewId) {
      // Generate feedback and redirect
      const generateFeedback = async () => {
        try {
          const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              interviewId,
              userId,
              transcript: messages,
              feedbackId
            }),
          });

          if (response.ok) {
            router.push(`/interview/${interviewId}/feedback`);
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Failed to generate feedback:', error);
          router.push('/dashboard');
        }
      };

      const timer = setTimeout(generateFeedback, 3000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, type, interviewId, userId, feedbackId, messages, router]);

  // Auto-start for interview generation
  useEffect(() => {
    if (type === 'generate' && canStartListening) {
      startListening();
    }
  }, [type, canStartListening, startListening]);

  const getStatusDisplay = () => {
    if (error) return { text: 'Error', color: 'text-red-400', bg: 'bg-red-500/20' };
    if (isProcessing) return { text: 'Processing...', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (isSpeaking) return { text: 'Speaking', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (isRecording) return { text: 'Recording', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (isListening) return { text: 'Listening', color: 'text-purple-400', bg: 'bg-purple-500/20' };
    return { text: 'Ready', color: 'text-gray-400', bg: 'bg-gray-500/20' };
  };

  const status = getStatusDisplay();

  return (
    <div className={cn('voice-interface-container', className)}>
      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Voice Error</span>
            </div>
            <button 
              onClick={clearError}
              className="text-red-300 hover:text-red-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-red-300 mt-1">{error}</p>
        </div>
      )}

      {/* Main Voice Interface */}
      <div className="apple-glass rounded-3xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {type === 'generate' ? 'Interview Creation' : `AI Interview Session`}
          </h2>
          <p className="text-white/70">
            {type === 'generate' 
              ? 'Speak to create your personalized interview'
              : `${interviewType.charAt(0).toUpperCase() + interviewType.slice(1)} Interview`
            }
          </p>
          
          {progress && (
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full">
                <span className="text-sm">Question {progress.current} of {progress.total}</span>
                <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Avatar and Status */}
        <div className="flex justify-center items-center gap-12 mb-8">
          {/* AI Avatar */}
          <div className="text-center">
            <div className={cn(
              'relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300',
              isSpeaking ? 'border-green-400 shadow-lg shadow-green-400/30 scale-110' : 'border-white/20'
            )}>
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              {isSpeaking && (
                <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping" />
              )}
            </div>
            <p className="text-white/80 font-medium mt-2">AI Interviewer</p>
          </div>

          {/* User Avatar */}
          <div className="text-center">
            <div className={cn(
              'relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300',
              isRecording ? 'border-red-400 shadow-lg shadow-red-400/30 scale-110' : 
              isListening ? 'border-blue-400 shadow-lg shadow-blue-400/30' : 'border-white/20'
            )}>
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {isRecording && (
                <div className="absolute inset-0 border-4 border-red-400 rounded-full animate-ping" />
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
            {isActive && (
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-4 bg-current rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-4 bg-current rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            )}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setMode('auto')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                mode === 'auto' 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-white/60 hover:text-white/80'
              )}
            >
              Auto Mode
            </button>
            <button
              onClick={() => setMode('push')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                mode === 'push' 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-white/60 hover:text-white/80'
              )}
            >
              Push to Talk
            </button>
          </div>
        </div>

        {/* Transcript Display */}
        {showTranscript && (transcript || response) && (
          <div className="mb-6 space-y-4">
            {transcript && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-400">You said:</span>
                </div>
                <p className="text-white/90">{transcript}</p>
              </div>
            )}
            
            {response && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-sm font-medium text-green-400">AI Interviewer:</span>
                </div>
                <p className="text-white/90">{response}</p>
              </div>
            )}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {mode === 'auto' ? (
            <div className="flex gap-4">
              {!isListening ? (
                <button
                  onClick={startListening}
                  disabled={!canStartListening}
                  className={cn(
                    'flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300',
                    canStartListening ? 
                      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-105' :
                      'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Start Conversation</span>
                </button>
              ) : (
                <button
                  onClick={stopListening}
                  className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                  </svg>
                  <span>Stop</span>
                </button>
              )}
            </div>
          ) : (
            <button
              onMouseDown={pushToTalk}
              onMouseUp={releasePushToTalk}
              onTouchStart={pushToTalk}
              onTouchEnd={releasePushToTalk}
              className={cn(
                'flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 select-none',
                isRecording 
                  ? 'bg-red-600 text-white shadow-lg scale-105' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>{isRecording ? 'Recording...' : 'Hold to Talk'}</span>
            </button>
          )}

          {messages.length > 0 && (
            <button
              onClick={resetConversation}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Reset</span>
            </button>
          )}
        </div>

        {/* Toggle Transcript */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            {showTranscript ? 'Hide' : 'Show'} Transcript
          </button>
        </div>
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-semibold text-green-400">Interview Complete!</span>
          </div>
          <p className="text-white/70">
            {type === 'interview' 
              ? 'Generating your feedback... You will be redirected shortly.'
              : 'Your interview has been created successfully!'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;