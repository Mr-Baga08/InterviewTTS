// app/(root)/practice/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getLatestInterviews } from "@/lib/actions/general.action";
import InterviewCard, { InterviewCardSkeleton } from "@/components/InterviewCard";

const PracticePage = async () => {
  const user = await getCurrentUser();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-white/60 mb-4">Please sign in to access practice sessions.</p>
          <Link 
            href="/sign-in"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Get latest public interviews for practice
  const interviewsResult = await getLatestInterviews({
    userId: user.id,
    limit: 12
  });
  
  const interviews = interviewsResult.success ? interviewsResult.data || [] : [];

  return (
    <div className="apple-container">
      {/* Header */}
      <div className="mb-8 animate-apple-slide">
        <div className="apple-glass rounded-3xl p-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Quick Practice
              </h1>
              <p className="text-white/60">Jump into practice sessions instantly</p>
            </div>
          </div>
          
          <p className="text-white/80 max-w-2xl mx-auto">
            Practice with community-created interviews or start a quick session to sharpen your skills
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 animate-apple-slide" style={{ animationDelay: "0.1s" }}>
        <div className="apple-glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Start</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/interview"
              className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Create Custom</h3>
              <p className="text-white/60 text-sm">Generate questions for your specific role and tech stack</p>
            </Link>

            <button className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition-colors">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Random Interview</h3>
              <p className="text-white/60 text-sm">Get surprised with a random interview challenge</p>
            </button>

            <button className="p-6 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">Skill Builder</h3>
              <p className="text-white/60 text-sm">Focus on specific skills you want to improve</p>
            </button>
          </div>
        </div>
      </div>

      {/* Community Interviews */}
      <div className="animate-apple-slide" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Community Practice</h2>
          <Link 
            href="/interviews"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Browse All
          </Link>
        </div>

        {interviews.length === 0 ? (
          <div className="apple-glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No practice interviews available</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Be the first to create an interview for the community!
            </p>
            <Link 
              href="/interview"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Interview
            </Link>
          </div>
        ) : (
          <div className="apple-cards-grid">
            <Suspense fallback={
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <InterviewCardSkeleton key={i} />
                ))}
              </>
            }>
              {interviews.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interviewId={interview.id}
                  userId={user.id}
                  role={interview.role}
                  type={interview.type}
                  techstack={interview.techstack || []}
                  createdAt={interview.createdAt}
                  variant="compact"
                  showProgress={false}
                  showActions={true}
                />
              ))}
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage;