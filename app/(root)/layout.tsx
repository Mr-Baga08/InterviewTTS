// app/(root)/layout.tsx
import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  
  // Only redirect if user is NOT authenticated
  if (!isUserAuthenticated) {
    console.log("🔥 RootLayout: User not authenticated, redirecting to sign-in");
    redirect("/sign-in");
  }

  console.log("🔥 RootLayout: User authenticated, rendering protected layout");

  return (
    <div className="apple-root-layout">
      {/* Apple-style Navigation Bar */}
      <nav className="apple-navbar">
        <div className="apple-navbar-content">
          {/* Logo and Brand */}
          <Link href="/" className="apple-brand-link group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105">
                <Image 
                  src="/logo.svg" 
                  alt="TheTruthSchool Logo" 
                  width={24} 
                  height={20}
                  className="filter brightness-0 invert"
                />
              </div>
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10" />
            </div>
            <div className="brand-text">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
              TheTruthSchool
              </h2>
              <p className="text-xs text-white/50 font-medium hidden sm:block">AI Interview Prep</p>
            </div>
          </Link>

          {/* Navigation Menu */}
          <div className="apple-nav-menu">
            <Link href="/dashboard" className="apple-nav-item group">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="nav-text">Dashboard</span>
              <div className="apple-nav-indicator" />
            </Link>

            <Link href="/interview" className="apple-nav-item group">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="nav-text">Create Interview</span>
              <div className="apple-nav-indicator" />
            </Link>

            <div className="apple-nav-divider" />

            {/* User Profile Button */}
            <button className="apple-profile-button group">
              <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:from-white/30 group-hover:to-white/20">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="sr-only">User Profile</span>
            </button>
          </div>
        </div>

        {/* Glassmorphic background */}
        <div className="apple-navbar-bg" />
      </nav>

      {/* Main Content Area */}
      <main className="apple-main-content">
        {/* Content wrapper with proper spacing */}
        <div className="apple-content-wrapper">
          {children}
        </div>

        {/* Background Elements */}
        <div className="apple-bg-elements">
          {/* Animated gradient orbs */}
          <div className="apple-bg-orb apple-bg-orb-1" />
          <div className="apple-bg-orb apple-bg-orb-2" />
          <div className="apple-bg-orb apple-bg-orb-3" />
          
          {/* Grid pattern overlay */}
          <div className="apple-grid-pattern" />
        </div>
      </main>

      {/* Status Bar for iOS-like experience */}
      <div className="apple-status-indicator">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-white/60 font-medium">AI Ready</span>
        </div>
      </div>
    </div>
  );
};

export default Layout;