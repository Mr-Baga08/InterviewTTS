// app/(root)/dashboard/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewsByUserId } from "@/lib/actions/general.action";
import InterviewCard, { InterviewCardSkeleton } from "@/components/InterviewCard";

// Loading skeleton for dashboard
const DashboardSkeleton = () => (
  <div className="space-y-8">
    {/* Header skeleton */}
    <div className="animate-pulse">
      <div className="h-8 w-64 bg-white/10 rounded mb-2" />
      <div className="h-4 w-96 bg-white/10 rounded" />
    </div>
    
    {/* Stats skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="apple-glass rounded-2xl p-6 animate-pulse">
          <div className="h-6 w-24 bg-white/10 rounded mb-2" />
          <div className="h-8 w-16 bg-white/10 rounded mb-2" />
          <div className="h-3 w-32 bg-white/10 rounded" />
        </div>
      ))}
    </div>
    
    {/* Interviews grid skeleton */}
    <div className="apple-cards-grid">
      {[1, 2, 3, 4].map((i) => (
        <InterviewCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

const Dashboard = async () => {
  const user = await getCurrentUser();
  
  if (!user) {
    // This shouldn't happen due to layout protection, but adding as safety
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-white/60 mb-4">Please sign in to access your dashboard.</p>
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

  // Fetch user's interviews
  const interviewsResult = await getInterviewsByUserId(user.id);
  const interviews = interviewsResult.success ? interviewsResult.data || [] : [];

  // Calculate stats
  const stats = {
    totalInterviews: interviews.length,
    completedInterviews: interviews.filter(interview => 
      // You might want to check if feedback exists for completed interviews
      interview.status === 'completed'
    ).length,
    averageScore: user.stats?.averageScore || 0,
  };

  return (
    <div className="apple-container">
      {/* Welcome Header */}
      <div className="mb-8 animate-apple-slide">
        <div className="apple-glass rounded-3xl p-8 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Welcome back, {user.name}!
              </h1>
              <p className="text-white/60">Ready to practice and improve your interview skills?</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-apple-slide" style={{ animationDelay: "0.1s" }}>
        <div className="apple-glass rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.totalInterviews}</div>
          <div className="text-white/60 text-sm">Total Interviews</div>
        </div>

        <div className="apple-glass rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.completedInterviews}</div>
          <div className="text-white/60 text-sm">Completed</div>
        </div>

        <div className="apple-glass rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{stats.averageScore}</div>
          <div className="text-white/60 text-sm">Average Score</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 animate-apple-slide" style={{ animationDelay: "0.2s" }}>
        <div className="apple-glass rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/interview"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Interview
            </Link>
            
            <Link 
              href="/practice"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 hover:scale-105 apple-glass"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1" />
              </svg>
              Quick Practice
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Interviews */}
      <div className="animate-apple-slide" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Your Interviews</h2>
          {interviews.length > 0 && (
            <Link 
              href="/interviews"
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              View All
            </Link>
          )}
        </div>

        {interviews.length === 0 ? (
          <div className="apple-glass rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No interviews yet</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Get started by creating your first AI-powered interview practice session. It only takes a few minutes!
            </p>
            <Link 
              href="/interview"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Interview
            </Link>
          </div>
        ) : (
          <div className="apple-cards-grid">
            <Suspense fallback={
              <>
                {[1, 2, 3, 4].map((i) => (
                  <InterviewCardSkeleton key={i} />
                ))}
              </>
            }>
              {interviews.slice(0, 6).map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interviewId={interview.id}
                  userId={user.id}
                  role={interview.role}
                  type={interview.type}
                  techstack={interview.techstack || []}
                  createdAt={interview.createdAt}
                  showProgress={true}
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

export default Dashboard;