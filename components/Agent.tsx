// components/Agent.tsx - Updated to use Voice Pipeline
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import VoiceInterface from './VoiceInterface';
import VoicePipelineTest from './VoicePipelineTest';

interface AgentProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  interviewType?: 'technical' | 'behavioral' | 'mixed';
  className?: string;
}

const Agent: React.FC<AgentProps> = ({
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
  const [showTestMode, setShowTestMode] = useState(false);

  // Determine interview type from questions if not specified
  const determineInterviewType = (questionList: string[]): 'technical' | 'behavioral' | 'mixed' => {
    if (questionList.length === 0) return 'mixed';
    
    const technicalKeywords = ['code', 'algorithm', 'system', 'database', 'api', 'framework', 'performance', 'design'];
    const behavioralKeywords = ['team', 'conflict', 'leadership', 'project', 'challenge', 'experience', 'time', 'difficult'];
    
    let technicalCount = 0;
    let behavioralCount = 0;
    
    questionList.forEach(question => {
      const lowerQuestion = question.toLowerCase();
      if (technicalKeywords.some(keyword => lowerQuestion.includes(keyword))) {
        technicalCount++;
      }
      if (behavioralKeywords.some(keyword => lowerQuestion.includes(keyword))) {
        behavioralCount++;
      }
    });
    
    const ratio = technicalCount / (technicalCount + behavioralCount || 1);
    if (ratio > 0.7) return 'technical';
    if (ratio < 0.3) return 'behavioral';
    return 'mixed';
  };

  const finalInterviewType = interviewType || determineInterviewType(questions);

  // Handle test mode for development
  const isTestMode = process.env.NODE_ENV === 'development' && showTestMode;

  return (
    <div className={cn('agent-container', className)}>
      {/* Development Test Toggle */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowTestMode(!showTestMode)}
            className="text-sm px-3 py-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition-colors"
          >
            {showTestMode ? 'Hide Tests' : 'Show Tests'}
          </button>
        </div>
      )}

      {/* Header Information */}
      <div className="mb-6">
        <div className="apple-glass rounded-2xl p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {type === 'generate' ? 'Interview Creation' : 'AI Interview Session'}
            </h2>
            <p className="text-white/70">
              {type === 'generate' 
                ? 'Speak to configure and create your personalized interview'
                : `${finalInterviewType.charAt(0).toUpperCase() + finalInterviewType.slice(1)} Interview - ${questions.length} questions`
              }
            </p>
            
            {type === 'interview' && questions.length > 0 && (
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Est. {Math.max(20, questions.length * 3)} minutes</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span>Voice Powered</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Interview Instructions */}
      {type === 'interview' && !isTestMode && (
        <div className="mb-6">
          <div className="apple-glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Before You Begin
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">Microphone Ready</h4>
                    <p className="text-white/60 text-sm">Ensure your microphone is working and positioned correctly</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">Take Your Time</h4>
                    <p className="text-white/60 text-sm">Think before answering, quality over speed</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">Natural Conversation</h4>
                    <p className="text-white/60 text-sm">Speak naturally as you would in a real interview</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">AI-Powered Analysis</h4>
                    <p className="text-white/60 text-sm">Receive detailed feedback on your performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Mode */}
      {isTestMode ? (
        <VoicePipelineTest />
      ) : (
        /* Voice Interface */
        <VoiceInterface
          userName={userName}
          userId={userId}
          interviewId={interviewId}
          feedbackId={feedbackId}
          type={type}
          questions={questions}
          interviewType={finalInterviewType}
          className="animate-apple-slide"
        />
      )}

      {/* Technology Information */}
      <div className="mt-6">
        <div className="apple-glass rounded-2xl p-4">
          <div className="flex items-center justify-center gap-6 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Real-time Voice</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agent;