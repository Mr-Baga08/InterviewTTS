import AuthForm from "@/components/AuthForm";

const Page = () => {
  return (
    <div className="apple-signup-container">
      {/* Header section with branding */}
      <div className="mb-8 text-center animate-apple-slide">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
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
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl blur-lg opacity-20 -z-10" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            TheTruthSchool
          </h1>
        </div>
        
        <h2 className="text-xl font-semibold text-white/90 mb-2">
          Create Your Account
        </h2>
        <p className="text-white/60 max-w-sm mx-auto leading-relaxed">
          Join our platfrom where professionals mastering their interview skills with AI-powered practice
        </p>
      </div>

      {/* Auth Form with enhanced wrapper */}
      <div className="relative">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl -z-10 scale-110" />
        
        {/* Main form container */}
        <div className="relative animate-apple-zoom">
          <AuthForm type="sign-up" />
        </div>
      </div>

      {/* Footer section */}
      <div className="mt-8 text-center space-y-4 animate-apple-slide" style={{ animationDelay: "0.2s" }}>
        {/* Features highlight */}
        <div className="flex items-center justify-center gap-6 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>AI-Powered</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Free to Start</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Instant Feedback</span>
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-white/40 max-w-md mx-auto">
          By creating an account, you agree to our Terms of Service and Privacy Policy. 
          Your data is encrypted and secure.
        </p>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-xl" />
      <div className="absolute bottom-10 left-10 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-xl" />
    </div>
  );
};

export default Page;