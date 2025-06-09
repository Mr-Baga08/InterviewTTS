import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import React from "react";

// Enhanced types for better type safety
interface RouteParams {
  params: Promise<{ id: string }>;
}

interface InterviewStatusInfo {
  status: string;
  color: string;
  bgColor: string;
  icon: string;
}

interface TypeStyleInfo {
  bg: string;
  text: string;
  border: string;
}

// Loading components for better UX
const InterviewHeaderSkeleton = () => (
  <div className="apple-glass apple-shadow-lg rounded-3xl p-6 animate-pulse">
    <div className="flex justify-end mb-4">
      <div className="w-24 h-8 bg-white/10 rounded-full" />
    </div>
    <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-2xl" />
          <div className="space-y-2">
            <div className="w-48 h-6 bg-white/10 rounded" />
            <div className="w-32 h-4 bg-white/10 rounded" />
          </div>
        </div>
      </div>
      <div className="w-32 h-10 bg-white/10 rounded-xl" />
    </div>
  </div>
);

const InterviewDetails = async ({ params }: RouteParams) => {
  // Await params properly
  const { id } = await params;

  // Parallel data fetching for better performance
  const [user, interview] = await Promise.all([
    getCurrentUser(),
    getInterviewById(id)
  ]);

  // Early redirect if no interview found
  if (!interview.success || !interview.data) {
    redirect("/");
  }

  const interviewData = interview.data;

  // Fetch feedback only if we have valid user and interview
  const feedback = user?.id ? await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  }) : null;

  // Enhanced interview status logic
  const getInterviewStatus = (): InterviewStatusInfo => {
    if (feedback?.success && feedback.data?.id) {
      return {
        status: "Completed",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
        icon: "check-circle"
      };
    }
    
    if (interviewData.status === "in-progress") {
      return {
        status: "In Progress",
        color: "text-amber-400",
        bgColor: "bg-amber-500/20", 
        icon: "clock"
      };
    }
    
    return {
      status: "Ready to Start",
      color: "text-blue-400", 
      bgColor: "bg-blue-500/20",
      icon: "play-circle"
    };
  };

  // Enhanced type styling with more options
  const getTypeStyle = (type: string): TypeStyleInfo => {
    const normalizedType = /mix/gi.test(type) ? "Mixed" : type;
    
    const typeStyles: Record<string, TypeStyleInfo> = {
      "Behavioral": { 
        bg: "bg-purple-500/20", 
        text: "text-purple-400", 
        border: "border-purple-500/30" 
      },
      "Technical": { 
        bg: "bg-blue-500/20", 
        text: "text-blue-400", 
        border: "border-blue-500/30" 
      },
      "Mixed": { 
        bg: "bg-indigo-500/20", 
        text: "text-indigo-400", 
        border: "border-indigo-500/30" 
      },
      "System Design": { 
        bg: "bg-cyan-500/20", 
        text: "text-cyan-400", 
        border: "border-cyan-500/30" 
      },
      "Coding": { 
        bg: "bg-green-500/20", 
        text: "text-green-400", 
        border: "border-green-500/30" 
      }
    };

    return typeStyles[normalizedType] || { 
      bg: "bg-gray-500/20", 
      text: "text-gray-400", 
      border: "border-gray-500/30" 
    };
  };

  const statusInfo = getInterviewStatus();
  const typeStyle = getTypeStyle(interviewData.type);
  const feedbackData = feedback?.success ? feedback.data : null;

  // Convert InterviewQuestion[] to string[] for Agent component
  const questionsAsStrings = React.useMemo(() => {
    if (!interviewData.questions) return [];
    
    // Handle both string[] and InterviewQuestion[] formats
    return interviewData.questions.map((question: any) => {
      // If it's already a string, return as-is
      if (typeof question === 'string') {
        return question;
      }
      
      // If it's an InterviewQuestion object, extract the question text
      if (typeof question === 'object' && question !== null) {
        return question.question || question.text || question.content || String(question);
      }
      
      // Fallback for other types
      return String(question);
    });
  }, [interviewData.questions]);

  // Enhanced navigation handler with better UX
  const handleViewFeedback = () => {
    // Add loading state here if needed
    window.location.href = `/interview/${id}/feedback`;
  };

  // Helper to get icon based on status
  const getStatusIcon = (iconType: string) => {
    const icons = {
      "check-circle": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      "play-circle": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1" />
        </svg>
      ),
      "clock": (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    return icons[iconType as keyof typeof icons] || icons["play-circle"];
  };

  // Estimate interview duration
  const estimatedDuration = Math.max(20, questionsAsStrings.length * 3);

  return (
    <div className="apple-interview-container">
      {/* Enhanced Header Section */}
      <div className="apple-interview-header animate-apple-slide">
        <div className="apple-glass apple-shadow-lg rounded-3xl p-6">
          {/* Status Badge with Icon */}
          <div className="flex justify-end mb-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bgColor} border ${typeStyle.border}`}>
              <div className={`w-2 h-2 rounded-full ${statusInfo.color.replace('text-', 'bg-')} animate-pulse`} />
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.status}
              </span>
            </div>
          </div>

          {/* Main Header Content */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Left Side - Interview Info */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Interview Avatar and Title */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 bg-gradient-to-br from-white/10 to-white/5">
                    <Image
                      src={interviewData.coverImage || getRandomInterviewCover()}
                      alt={`${interviewData.role} interview cover`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                  {/* Enhanced glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-lg -z-10" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold capitalize bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {interviewData.role} Interview
                  </h1>
                  <p className="text-white/60 font-medium">
                    AI-Powered Practice Session
                  </p>
                  {/* Duration estimate */}
                  <p className="text-white/40 text-sm">
                    Est. {estimatedDuration} minutes
                  </p>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="flex items-center gap-3">
                <span className="text-white/50 text-sm font-medium">Tech Stack:</span>
                <Suspense fallback={<div className="w-20 h-8 bg-white/10 rounded animate-pulse" />}>
                  <DisplayTechIcons techStack={interviewData.techstack || []} />
                </Suspense>
              </div>
            </div>

            {/* Right Side - Interview Type Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${typeStyle.bg} border ${typeStyle.border}`}>
              <svg className={`w-4 h-4 ${typeStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className={`font-semibold ${typeStyle.text}`}>
                {/mix/gi.test(interviewData.type) ? "Mixed" : interviewData.type}
              </span>
            </div>
          </div>

          {/* Enhanced Interview Stats Row */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {questionsAsStrings.length}
                </div>
                <div className="text-xs text-white/50">Questions</div>
              </div>
              
              {feedbackData && (
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">
                    {feedbackData.totalScore}/100
                  </div>
                  <div className="text-xs text-white/50">Last Score</div>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">
                  AI
                </div>
                <div className="text-xs text-white/50">Interviewer</div>
              </div>

              {/* Difficulty indicator */}
              {interviewData.metadata?.difficulty && (
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">
                    {interviewData.metadata.difficulty}
                  </div>
                  <div className="text-xs text-white/50">Difficulty</div>
                </div>
              )}
            </div>

            {/* Enhanced Quick Action Button */}
            {feedbackData && (
              <button
                onClick={handleViewFeedback}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 group"
                aria-label="View interview feedback"
              >
                <svg className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                  View Feedback
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Pre-Interview Instructions */}
      <div className="apple-interview-instructions animate-apple-slide" style={{ animationDelay: "0.1s" }}>
        <div className="apple-glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Before You Begin
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Audio Check */}
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/8 transition-colors group">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Audio Check</h3>
                <p className="text-sm text-white/70">Ensure your microphone is working properly</p>
              </div>
            </div>

            {/* Time Management */}
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/8 transition-colors group">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/30 transition-colors">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Take Your Time</h3>
                <p className="text-sm text-white/70">Think before answering, quality over speed</p>
              </div>
            </div>

            {/* Natural Communication */}
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/8 transition-colors group">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Be Natural</h3>
                <p className="text-sm text-white/70">Speak as you would in a real interview</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Agent Component Wrapper */}
      <div className="apple-interview-agent animate-apple-slide" style={{ animationDelay: "0.2s" }}>
        <div className="relative">
          {/* Enhanced background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-3xl blur-3xl -z-10 scale-110" />
          
          <Suspense fallback={
            <div className="apple-glass rounded-3xl p-8 text-center">
              <div className="animate-pulse">
                <div className="w-32 h-32 bg-white/10 rounded-full mx-auto mb-4" />
                <div className="w-48 h-6 bg-white/10 rounded mx-auto mb-2" />
                <div className="w-32 h-4 bg-white/10 rounded mx-auto" />
              </div>
            </div>
          }>
            <Agent
              userName={user?.name || "User"}
              userId={user?.id || ""}
              interviewId={id}
              type="interview"
              questions={questionsAsStrings}
              feedbackId={feedbackData?.id}
            />
          </Suspense>
        </div>
      </div>

      {/* Enhanced Floating Decorative Elements */}
      <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl animate-float opacity-50" />
      <div className="absolute bottom-32 left-10 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl animate-float opacity-50" style={{ animationDelay: "3s" }} />
      <div className="absolute top-1/2 right-20 w-12 h-12 bg-gradient-to-br from-indigo-500/15 to-transparent rounded-full blur-xl animate-float opacity-30" style={{ animationDelay: "6s" }} />
    </div>
  );
};

export default InterviewDetails;