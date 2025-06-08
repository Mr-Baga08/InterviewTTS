import AuthForm from "@/components/AuthForm";

const Page = () => {
  return (
    <div className="apple-signin-container">
      {/* Header section with branding */}
      <div className="mb-8 text-center animate-apple-slide">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg 
                className="w-7 h-7 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 10V3L4 14h7v7l9-11h-7z" 
                />
              </svg>
            </div>
            {/* Animated glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-30 -z-10 animate-pulse-glow" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
            PrepWise
          </h1>
        </div>
        
        <h2 className="text-2xl font-semibold text-white/95 mb-3">
          Welcome Back
        </h2>
        <p className="text-white/65 max-w-sm mx-auto leading-relaxed">
          Continue your journey to interview excellence. Sign in to access your personalized practice sessions.
        </p>
      </div>

      {/* Auth Form with enhanced wrapper */}
      <div className="relative">
        {/* Dynamic background glow that responds to form state */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl -z-10 scale-110 animate-subtle-glow" />
        
        {/* Main form container */}
        <div className="relative animate-apple-zoom">
          <AuthForm type="sign-in" />
        </div>
      </div>

      {/* Quick stats section */}
      <div className="mt-8 text-center animate-apple-slide" style={{ animationDelay: "0.2s" }}>
        {/* <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-white/90">10K+</div>
            <div className="text-xs text-white/50">Users</div>
          </div>
          <div className="text-center border-x border-white/10">
            <div className="text-lg font-bold text-white/90">50K+</div>
            <div className="text-xs text-white/50">Interviews</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white/90">95%</div>
            <div className="text-xs text-white/50">Success Rate</div>
          </div>
        </div> */}

        {/* Trust indicators */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Encrypted</span>
            </div>
          </div>
          
          {/* Demo access note */}
          <p className="text-xs text-white/40 max-w-md mx-auto">
            New to PrepWise? Experience the future of interview preparation with our AI-powered platform.
          </p>
        </div>
      </div>

      {/* Floating call-to-action */}
      <div className="mt-6 text-center animate-apple-slide" style={{ animationDelay: "0.4s" }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse" />
          <span className="text-xs text-white/60">
            AI interviewer ready
          </span>
        </div>
      </div>

      {/* Decorative elements - positioned differently from sign-up */}
      <div className="absolute top-16 left-16 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-16 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl" />
      <div className="absolute top-1/2 right-8 w-3 h-3 bg-white/20 rounded-full animate-float" />
      <div className="absolute bottom-1/3 left-12 w-2 h-2 bg-blue-400/30 rounded-full animate-float" style={{ animationDelay: "1s" }} />
    </div>
  );
};

export default Page;