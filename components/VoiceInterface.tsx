// components/VoiceInterface.tsx - Updated with Troubleshooting Integration
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useVoicePipeline } from '@/hooks/useVoicePipeline';
import VoicePipelineStatus from '@/components/VoicePipelineStatus'; // Import the troubleshooting component
import { Mic, MicOff, Volume2, VolumeX, Settings, MessageSquare } from 'lucide-react';

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
  const [showStatus, setShowStatus] = useState(false); // Toggle for troubleshooting panel

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
    audioLevel,
    connectionStatus,
    
    // Enhanced properties for troubleshooting
    rateLimitState,
    canMakeRequest,
    
    // Actions
    startListening,
    stopListening,
    pushToTalk,
    releasePushToTalk,
    clearError,
    resetConversation,
    retryLastRequest,
    
    // Computed
    canStartListening,
    isActive,
    progress
  } = useVoicePipeline({
    interviewType,
    questions,
    vadThreshold: 0.01,
    silenceTimeout: 2000,
    maxRecordingTime: 30000,
    providers: {
      stt: 'whisper', // Will fallback to deepgram, then basic
      llm: 'openai',
      tts: 'openai'
    },
    rateLimiting: {
      enabled: true,
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  });

  // Auto-show status panel when there are issues
  useEffect(() => {
    if (error || rateLimitState.isRateLimited || rateLimitState.failedAttempts > 0) {
      setShowStatus(true);
    }
  }, [error, rateLimitState.isRateLimited, rateLimitState.failedAttempts]);

  // Handle interview completion
  useEffect(() => {
    if (isComplete && type === 'interview' && interviewId) {
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
            const { feedbackId: newFeedbackId } = await response.json();
            router.push(`/feedback/${newFeedbackId}`);
          }
        } catch (error) {
          console.error('Failed to generate feedback:', error);
        }
      };

      generateFeedback();
    }
  }, [isComplete, type, interviewId, userId, messages, feedbackId, router]);

  const getAudioLevelHeight = () => {
    return Math.max(4, Math.min(100, audioLevel * 100));
  };

  const handleMainAction = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-50", className)}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Voice {type === 'interview' ? 'Interview' : 'Generation'}
          </h2>
          {progress && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Question {progress.current} of {progress.total}</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setMode('auto')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                mode === 'auto' 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Auto
            </button>
            <button
              onClick={() => setMode('push')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                mode === 'push' 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Push
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowStatus(!showStatus)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showStatus 
                ? "bg-blue-100 text-blue-600" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            title="Show Status & Troubleshooting"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Transcript Toggle */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showTranscript 
                ? "bg-blue-100 text-blue-600" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Voice Interface */}
        <div className="flex-1 flex flex-col">
          {/* Audio Visualizer & Controls */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
            {/* Audio Level Visualizer */}
            <div className="flex items-end justify-center gap-1 h-24">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 rounded-full transition-all duration-100",
                    isRecording
                      ? "bg-red-500"
                      : isListening
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  )}
                  style={{
                    height: `${Math.max(4, (audioLevel * 100) - (Math.abs(i - 10) * 5))}px`
                  }}
                />
              ))}
            </div>

            {/* Main Control Button */}
            <div className="relative">
              <button
                onClick={handleMainAction}
                disabled={!canStartListening && !isListening}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
                  isListening
                    ? "bg-red-500 hover:bg-red-600 text-white scale-110"
                    : canStartListening
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>

              {/* Processing Indicator */}
              {isProcessing && (
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
              )}

              {/* Recording Indicator */}
              {isRecording && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse" />
              )}

              {/* Speaking Indicator */}
              {isSpeaking && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <Volume2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Status Text */}
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isProcessing
                  ? "Processing..."
                  : isRecording
                  ? "Recording..."
                  : isSpeaking
                  ? "Speaking..."
                  : isListening
                  ? mode === 'push' ? "Hold to talk" : "Listening..."
                  : "Ready to start"
                }
              </p>
              
              {mode === 'push' && isListening && (
                <div className="space-y-2">
                  <button
                    onMouseDown={pushToTalk}
                    onMouseUp={releasePushToTalk}
                    onTouchStart={pushToTalk}
                    onTouchEnd={releasePushToTalk}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors"
                  >
                    Hold to Talk
                  </button>
                </div>
              )}

              {/* Rate Limit Warning */}
              {rateLimitState.isRateLimited && (
                <p className="text-orange-600 text-sm">
                  Rate limited - wait {rateLimitState.retryAfter}s
                </p>
              )}

              {/* Connection Status */}
              {connectionStatus !== 'connected' && connectionStatus !== 'disconnected' && (
                <p className="text-gray-600 text-sm capitalize">
                  {connectionStatus}...
                </p>
              )}
            </div>
          </div>

          {/* Transcript Area */}
          {showTranscript && (
            <div className="border-t border-gray-200 bg-white p-4 max-h-64 overflow-y-auto">
              <h3 className="font-medium text-gray-900 mb-3">Conversation</h3>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    No conversation yet. Start by clicking the microphone.
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "p-3 rounded-lg max-w-[80%]",
                        message.role === 'user'
                          ? "bg-blue-50 border border-blue-200 ml-auto"
                          : "bg-gray-50 border border-gray-200"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-900">{message.content}</p>
                        {message.metadata?.confidence && (
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {Math.round(message.metadata.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      {message.metadata?.provider && (
                        <p className="text-xs text-gray-500 mt-1">
                          via {message.metadata.provider}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Troubleshooting Status Panel */}
        {showStatus && (
          <div className="w-96 border-l border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Status & Troubleshooting</h3>
                <button
                  onClick={() => setShowStatus(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto">
              <VoicePipelineStatus
                rateLimitState={rateLimitState}
                connectionStatus={connectionStatus}
                isProcessing={isProcessing}
                error={error}
                onRetry={retryLastRequest}
                onReset={() => {
                  resetConversation();
                  clearError();
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Banner (if status panel is hidden) */}
      {error && !showStatus && (
        <div className="bg-red-50 border-t border-red-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-700 text-sm">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={retryLastRequest}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Retry
              </button>
              <button
                onClick={() => setShowStatus(true)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Details
              </button>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;