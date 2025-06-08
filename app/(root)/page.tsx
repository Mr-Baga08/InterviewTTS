import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

async function Home() {
  const user = await getCurrentUser();

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id! }),
  ]);

  const hasPastInterviews = userInterviews?.length! > 0;
  const hasUpcomingInterviews = allInterview?.length! > 0;

  return (
    <div className="apple-home-container">
      {/* Welcome Hero Section */}
      <section className="apple-hero-section animate-apple-slide">
        <div className="apple-glass apple-shadow-lg rounded-3xl p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-6">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
                  Welcome back, {user?.name?.split(' ')[0]}!
                </h1>
                <h2 className="text-xl lg:text-2xl font-semibold text-white/90 mb-4">
                  Master Your Next Interview with AI
                </h2>
                <p className="text-lg text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Practice real interview questions, receive instant AI feedback, and build the confidence you need to land your dream job.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild className="btn-primary apple-cta-button">
                  <Link href="/interview" className="flex items-center gap-3 justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Start New Interview
                  </Link>
                </Button>
                
                {hasPastInterviews && (
                  <Button asChild className="btn-secondary apple-secondary-button">
                    <Link href="#your-interviews" className="flex items-center gap-3 justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      View Progress
                    </Link>
                  </Button>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto lg:mx-0">
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-blue-400">
                    {userInterviews?.length || 0}
                  </div>
                  <div className="text-xs text-white/60 font-medium">Completed</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-green-400">
                    {allInterview?.length || 0}
                  </div>
                  <div className="text-xs text-white/60 font-medium">Available</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-purple-400">AI</div>
                  <div className="text-xs text-white/60 font-medium">Powered</div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex-shrink-0 relative">
              <div className="relative">
                <Image
                  src="/robot.png"
                  alt="AI Interview Assistant"
                  width={350}
                  height={350}
                  className="drop-shadow-2xl"
                  priority
                />
                {/* Glowing effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 rounded-full blur-3xl scale-110 -z-10" />
              </div>
              
              {/* Floating indicators */}
              <div className="absolute top-8 right-8 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-xs text-green-400 font-medium">AI Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Interviews Section */}
      <section id="your-interviews" className="apple-section animate-apple-slide" style={{ animationDelay: "0.1s" }}>
        <div className="apple-section-header">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Your Interview History</h2>
          </div>
          <p className="text-white/70 mb-8">
            Track your progress and review your completed interview sessions
          </p>
        </div>

        <div className="apple-cards-grid">
          {hasPastInterviews ? (
            userInterviews?.map((interview, index) => (
              <div 
                key={interview.id} 
                className="animate-apple-card"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <InterviewCard
                  userId={user?.id}
                  interviewId={interview.id}
                  role={interview.role}
                  type={interview.type}
                  techstack={interview.techstack}
                  createdAt={interview.createdAt}
                />
              </div>
            ))
          ) : (
            <div className="apple-empty-state">
              <div className="apple-glass rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Start Your First Interview</h3>
                <p className="text-white/60 mb-6">
                  You haven't taken any interviews yet. Create your first AI-powered practice session to get started.
                </p>
                <Button asChild className="btn-primary">
                  <Link href="/interview">Create Interview</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Available Interviews Section */}
      <section className="apple-section animate-apple-slide" style={{ animationDelay: "0.2s" }}>
        <div className="apple-section-header">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Practice Opportunities</h2>
          </div>
          <p className="text-white/70 mb-8">
            Explore curated interview sessions from various companies and roles
          </p>
        </div>

        <div className="apple-cards-grid">
          {hasUpcomingInterviews ? (
            allInterview?.map((interview, index) => (
              <div 
                key={interview.id} 
                className="animate-apple-card"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <InterviewCard
                  userId={user?.id}
                  interviewId={interview.id}
                  role={interview.role}
                  type={interview.type}
                  techstack={interview.techstack}
                  createdAt={interview.createdAt}
                />
              </div>
            ))
          ) : (
            <div className="apple-empty-state">
              <div className="apple-glass rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Interviews Available</h3>
                <p className="text-white/60 mb-6">
                  Check back later for new practice opportunities, or create your own custom interview session.
                </p>
                <Button asChild className="btn-primary">
                  <Link href="/interview">Create Custom Interview</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Success Tips Section */}
      <section className="apple-section animate-apple-slide" style={{ animationDelay: "0.3s" }}>
        <div className="apple-glass rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Interview Success Tips
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center group hover:bg-white/8 transition-all duration-300">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">Practice Regularly</h4>
              <p className="text-xs text-white/60">Consistency builds confidence</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center group hover:bg-white/8 transition-all duration-300">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">Take Your Time</h4>
              <p className="text-xs text-white/60">Think before you speak</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center group hover:bg-white/8 transition-all duration-300">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">Review Feedback</h4>
              <p className="text-xs text-white/60">Learn from each session</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center group hover:bg-white/8 transition-all duration-300">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">Stay Confident</h4>
              <p className="text-xs text-white/60">Believe in your abilities</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;