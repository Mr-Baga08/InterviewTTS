// app/(auth)/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  
  // Only redirect if user is authenticated AND we're not already on the redirect target
  if (isUserAuthenticated) {
    console.log("🔥 AuthLayout: User authenticated, redirecting to dashboard");
    redirect("/dashboard"); // Redirect to a specific dashboard route instead of "/"
  }

  console.log("🔥 AuthLayout: User not authenticated, rendering auth layout");

  return (
    <div className="apple-auth-layout">
      {/* Apple-style animated background */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl animate-pulse-slow delay-500" />
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 bg-noise opacity-[0.02]" />
      </div>

      {/* Content container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        {/* Main content wrapper */}
        <div className="w-full flex max-w-md">
          {/* Apple-style glassmorphic container */}
          <div className="apple-glass apple-shadow-lg rounded-3xl p-8 backdrop-blur-2xl border border-white/10">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            {/* Content */}
            <div className="relative z-10 animate-apple-zoom">
              {children}
            </div>
          </div>
          
          {/* Apple-style footer text */}
          {/* <div className="mt-8 text-center">
            <p className="text-white/60 text-sm font-medium">
              Designed for the future of interview preparation
            </p>
          </div> */}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-5 h-5 bg-white/20 rounded-full animate-float" />
        <div className="absolute top-40 right-32 w-4 h-4 bg-purple-400/30 rounded-full animate-float delay-300" />
        <div className="absolute bottom-32 left-16 w-5 h-5 bg-blue-400/25 rounded-full animate-float delay-700" />
        <div className="absolute bottom-50 right-2 w-7 h-7 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-40 right-20 w-6 h-6 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-30 right-20 w-3 h-3 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-10 right-20 w-2 h-2 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-20 right-26 w-6 h-6 bg-purple-400/30 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-20 right-30 w-2 h-2 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-20 right-40 w-6 h-6 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-20 right-50 w-5 h-5 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-20 right-60 w-4 h-4 bg-purple-400/30 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-50 right-25 w-6 h-6 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-60 right-35 w-3 h-3 bg-purple-400/30 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-70 right-30 w-2 h-2 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-80 right-50 w-6 h-6 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-90 right-60 w-3 h-3 bg-purple-400/30 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-55 right-65 w-2 h-2 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-45 right-85 w-6 h-6 bg-purple-400/30 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-35 right-5 w-3 h-3 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-15 right-10 w-2 h-2 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-45 right-45 w-6 h-6 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-35 right-33 w-3 h-3 bg-white/15 rounded-full animate-float delay-1000" />
        <div className="absolute bottom-15 right-44 w-2 h-2 bg-white/15 rounded-full animate-float delay-1000" />



        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      </div>
    </div>
  );
};

export default AuthLayout;