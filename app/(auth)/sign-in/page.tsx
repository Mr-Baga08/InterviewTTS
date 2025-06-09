import AuthForm from "@/components/AuthForm";

const SignInPage = () => {
  return (
    <>
      {/* Header section with branding - Outside the glass container */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg 
                className="w-6 h-6 text-white" 
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
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-30 -z-10 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
            TheTruthSchool
          </h1>
        </div>
        
        <h2 className="text-xl font-semibold text-white/95 mb-2">
          Welcome Back
        </h2>
        <p className="text-white/65 max-w-sm mx-auto leading-relaxed">
          Continue your journey to interview excellence. Sign in to access your personalized practice sessions.
        </p>
      </div>

      {/* Auth Form - This will be inside the glass container from AuthLayout */}
      <AuthForm type="sign-in" />

      {/* Footer section - Outside the glass container */}
      <div className="mt-6 text-center space-y-3">
        {/* Trust indicators */}
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
        
        <p className="text-xs text-white/40 max-w-md mx-auto">
          New to TheTruthSchool? Experience the future of interview preparation with our AI-powered platform.
        </p>
      </div>
    </>
  );
};

export default SignInPage;