import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { RouteParams } from "@/types";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  // Get interview data with proper error handling
  const interviewResult = await getInterviewById(id);
  if (!interviewResult.success || !interviewResult.data) {
    redirect("/");
  }
  const interview = interviewResult.data;

  // Get feedback data with proper error handling
  const feedbackResult = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  // Handle case where feedback doesn't exist yet
  if (!feedbackResult.success || !feedbackResult.data) {
    redirect(`/interview/${id}`); // Redirect to take the interview
  }
  const feedback = feedbackResult.data;

  // Calculate overall performance level
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: "Exceptional", color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
    if (score >= 80) return { level: "Excellent", color: "text-green-400", bgColor: "bg-green-500/20" };
    if (score >= 70) return { level: "Good", color: "text-blue-400", bgColor: "bg-blue-500/20" };
    if (score >= 60) return { level: "Fair", color: "text-yellow-400", bgColor: "bg-yellow-500/20" };
    return { level: "Needs Improvement", color: "text-orange-400", bgColor: "bg-orange-500/20" };
  };

  const performance = getPerformanceLevel(feedback.totalScore || 0);

  return (
    <div className="apple-feedback-container">
      {/* Hero Section */}
      <div className="apple-feedback-hero">
        <div className="relative">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-3xl blur-3xl -z-10 scale-110" />
          
          {/* Main content */}
          <div className="apple-glass apple-shadow-lg rounded-3xl p-8 text-center animate-apple-zoom">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30 -z-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Interview Complete
                </h1>
                <p className="text-white/60 capitalize">{interview.role} Position</p>
              </div>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (feedback.totalScore || 0) / 100)}`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{feedback.totalScore || 0}</div>
                      <div className="text-xs text-white/60">out of 100</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-left">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${performance.bgColor} mb-2`}>
                  <div className={`w-2 h-2 rounded-full ${performance.color.replace('text-', 'bg-')}`} />
                  <span className={`text-sm font-medium ${performance.color}`}>{performance.level}</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Image src="/calendar.svg" width={16} height={16} alt="calendar" />
                  <span className="text-sm">
                    {feedback.createdAt
                      ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Assessment */}
      <div className="apple-feedback-section animate-apple-slide" style={{ animationDelay: "0.1s" }}>
        <div className="apple-glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1.586l-4 4z" />
            </svg>
            Overall Assessment
          </h2>
          <p className="text-white/80 leading-relaxed">{feedback.finalAssessment}</p>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="apple-feedback-section animate-apple-slide" style={{ animationDelay: "0.2s" }}>
        <div className="apple-glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Performance Breakdown
          </h2>
          
          <div className="space-y-4">
            {feedback.categoryScores?.map((category: {
              name: string;
              score: number;
              comment: string;
            }, index: number) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white/90">{category.name}</span>
                  <span className="font-bold text-primary-200">{category.score}/100</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${category.score}%`,
                      animationDelay: `${index * 0.1}s`
                    }}
                  />
                </div>
                
                <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                  {category.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths and Improvements Grid */}
      <div className="grid md:grid-cols-2 gap-6 animate-apple-slide" style={{ animationDelay: "0.3s" }}>
        {/* Strengths */}
        <div className="apple-glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Key Strengths
          </h3>
          <ul className="space-y-2">
            {feedback.strengths?.map((strength: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-white/80">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="leading-relaxed">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="apple-glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Growth Opportunities
          </h3>
          <ul className="space-y-2">
            {feedback.areasForImprovement?.map((area: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-white/80">
                <svg className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="leading-relaxed">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 max-sm:flex-col animate-apple-slide" style={{ animationDelay: "0.4s" }}>
        <Button className="btn-secondary flex-1 apple-glass">
          <Link href="/" className="flex w-full justify-center items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm font-semibold text-primary-200">Back to Dashboard</span>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link href={`/interview/${id}`} className="flex w-full justify-center items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-semibold text-black">Retake Interview</span>
          </Link>
        </Button>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-10 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-xl animate-float" />
      <div className="absolute bottom-32 left-10 w-12 h-12 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl animate-float" style={{ animationDelay: "2s" }} />
    </div>
  );
};

export default Feedback;