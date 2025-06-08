import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <div className="apple-generate-container">
      {/* Hero Section */}
      <div className="apple-generate-hero animate-apple-slide">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              {/* Animated glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-3xl blur-xl opacity-40 -z-10 animate-pulse-glow" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                Create Interview
              </h1>
              <p className="text-white/60 font-medium">AI-Powered Question Generation</p>
            </div>
          </div>
          
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Let our AI create a personalized interview experience tailored to your target role and skill level
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="apple-glass rounded-2xl p-6 text-center group hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Smart Questions</h3>
            <p className="text-white/70 text-sm">AI generates role-specific questions based on industry standards</p>
          </div>

          <div className="apple-glass rounded-2xl p-6 text-center group hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/30 transition-colors">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Instant Setup</h3>
            <p className="text-white/70 text-sm">Get your personalized interview ready in seconds</p>
          </div>

          <div className="apple-glass rounded-2xl p-6 text-center group hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Real Feedback</h3>
            <p className="text-white/70 text-sm">Receive detailed analysis and improvement suggestions</p>
          </div>
        </div>
      </div>

      {/* Main Generation Section */}
      <div className="apple-generate-main animate-apple-slide" style={{ animationDelay: "0.1s" }}>
        <div className="apple-glass apple-shadow-lg rounded-3xl p-8">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Interview Configuration
            </h2>
            <p className="text-white/70">
              Configure your interview parameters below. Our AI will generate questions tailored to your specifications.
            </p>
          </div>

          {/* User Welcome */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 mb-8 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Welcome, {user?.name}!</h3>
                <p className="text-white/70 text-sm">Ready to create your next interview practice session?</p>
              </div>
            </div>
          </div>

          {/* Agent Component with Enhanced Container */}
          <div className="relative">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-2xl -z-10" />
            
            {/* Content wrapper */}
            <div className="relative z-10">
              <Agent
                userName={user?.name!}
                userId={user?.id}
                profileImage={user?.profileURL}
                type="generate"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="apple-generate-steps animate-apple-slide" style={{ animationDelay: "0.2s" }}>
        <div className="apple-glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">How It Works</h3>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-500/30 transition-colors">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <h4 className="font-medium text-white mb-2">Configure</h4>
              <p className="text-white/60 text-sm">Set your role, level, and preferences</p>
            </div>

            <div className="hidden md:block w-16 h-px bg-gradient-to-r from-blue-500/50 to-purple-500/50" />
            
            <div className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-500/30 transition-colors">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <h4 className="font-medium text-white mb-2">Generate</h4>
              <p className="text-white/60 text-sm">AI creates personalized questions</p>
            </div>

            <div className="hidden md:block w-16 h-px bg-gradient-to-r from-purple-500/50 to-green-500/50" />
            
            <div className="flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-500/30 transition-colors">
                <span className="text-green-400 font-bold">3</span>
              </div>
              <h4 className="font-medium text-white mb-2">Practice</h4>
              <p className="text-white/60 text-sm">Start your interview session</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="apple-generate-tips animate-apple-slide" style={{ animationDelay: "0.3s" }}>
        <div className="apple-glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Pro Tips
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-white mb-1">Be Specific</h4>
                <p className="text-white/70 text-sm">The more specific your role and tech stack, the better the questions</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-white mb-1">Practice Regularly</h4>
                <p className="text-white/70 text-sm">Create multiple interviews to practice different scenarios</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-32 right-16 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-40 left-16 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl animate-float" style={{ animationDelay: "2s" }} />
      <div className="absolute top-2/3 right-20 w-4 h-4 bg-white/20 rounded-full animate-float" style={{ animationDelay: "4s" }} />
    </div>
  );
};

export default Page;