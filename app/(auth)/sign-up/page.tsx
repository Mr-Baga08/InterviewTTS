// app/(auth)/sign-up/page.tsx
import AuthForm from "@/components/AuthForm";

const SignUpPage = () => {
  return (
    <>
      {/* Header section with branding - Outside the glass container */}
      <div className="mb-6 text-center">
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
          Join our platform where professionals master their interview skills with AI-powered practice
        </p>
      </div>

      {/* Auth Form - This will be inside the glass container from AuthLayout */}
      <AuthForm type="sign-up" />

      {/* Footer section - Outside the glass container */}
      <div className="mt-6 text-center space-y-3">
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
    </>
  );
};

export default SignUpPage;