import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const InterviewDetails = async ({ params }: RouteParams) => {
  const { id } = await params;

  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  // Determine interview status and styling
  const getInterviewStatus = () => {
    if (feedback?.id) {
      return {
        status: "Completed",
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        icon: "check-circle"
      };
    }
    return {
      status: "Ready to Start",
      color: "text-blue-400", 
      bgColor: "bg-blue-500/20",
      icon: "play-circle"
    };
  };

  const statusInfo = getInterviewStatus();

  // Get interview type styling
  const getTypeStyle = (type: string) => {
    const normalizedType = /mix/gi.test(type) ? "Mixed" : type;
    switch (normalizedType) {
      case "Behavioral":
        return { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" };
      case "Technical":
        return { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" };
      case "Mixed":
        return { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/30" };
      default:
        return { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" };
    }
  };

  const typeStyle = getTypeStyle(interview.type);

  return (
    <div className="apple-interview-container">
      {/* Header Section */}
      <div className="apple-interview-header animate-apple-slide">
        <div className="apple-glass apple-shadow-lg rounded-3xl p-6">
          {/* Status Badge */}
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
                      src={getRandomInterviewCover()}
                      alt="interview-cover"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-lg -z-10" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold capitalize bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {interview.role} Interview
                  </h1>
                  <p className="text-white/60 font-medium">
                    AI-Powered Practice Session
                  </p>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="flex items-center gap-3">
                <span className="text-white/50 text-sm font-medium">Tech Stack:</span>
                <DisplayTechIcons techStack={interview.techstack} />
              </div>
            </div>

            {/* Right Side - Interview Type Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${typeStyle.bg} border ${typeStyle.border}`}>
              <svg className={`w-4 h-4 ${typeStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className={`font-semibold ${typeStyle.text}`}>
                {/mix/gi.test(interview.type) ? "Mixed" : interview.type}
              </span>
            </div>
          </div>

          {/* Interview Stats Row */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {interview.questions?.length || 0}
                </div>
                <div className="text-xs text-white/50">Questions</div>
              </div>
              
              {feedback && (
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    {feedback.totalScore}/100
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
            </div>

            {/* Quick Action Button */}
            {feedback && (
              <button
                onClick={() => window.location.href = `/interview/${id}/feedback`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-white/80">View Feedback</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Interview Instructions */}
      <div className="apple-interview-instructions animate-apple-slide" style={{ animationDelay: "0.1s" }}>
        <div className="apple-glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Before You Begin
          </h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Audio Check</h3>
                <p className="text-sm text-white/70">Ensure your microphone is working properly</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Take Your Time</h3>
                <p className="text-sm text-white/70">Think before answering, quality over speed</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
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

      {/* Agent Component with Enhanced Wrapper */}
      <div className="apple-interview-agent animate-apple-slide" style={{ animationDelay: "0.2s" }}>
        <div className="relative">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-3xl blur-3xl -z-10 scale-110" />
          
          <Agent
            userName={user?.name!}
            userId={user?.id}
            interviewId={id}
            type="interview"
            questions={interview.questions}
            feedbackId={feedback?.id}
          />
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-32 left-10 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl animate-float" style={{ animationDelay: "3s" }} />
    </div>
  );
};

export default InterviewDetails;