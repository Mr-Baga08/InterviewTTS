// components/AppleNavbar.jsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const AppleNavbar = ({ user, onSignOut }) => {
  const pathname = usePathname();
  const [theme, setTheme] = useState('dark');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Navigation items
  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      href: "/interview",
      label: "Create Interview",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Enhanced Apple-style Navigation Bar */}
      <nav className={cn(
        // Base layout
        "fixed top-0 left-0 right-0 z-50 h-16",
        // Apple glassmorphism background
        "backdrop-blur-xl bg-white/80 dark:bg-black/80",
        "border-b border-gray-200/50 dark:border-white/10",
        // Enhanced shadow
        "shadow-lg shadow-black/5 dark:shadow-black/20",
        // Smooth transitions
        "transition-all duration-300 ease-out"
      )}>
        {/* Navbar Content Container */}
        <div className={cn(
          // Layout
          "flex items-center justify-between h-full",
          // Responsive padding
          "px-4 sm:px-6 lg:px-8",
          // Max width for large screens
          "max-w-7xl mx-auto",
          // Z-index for layering
          "relative z-10"
        )}>
          
          {/* Enhanced Brand Section */}
          <Link href="/dashboard" className={cn(
            // Layout
            "flex items-center gap-3",
            // Interactive states
            "group transition-all duration-300 ease-out",
            "hover:scale-105 active:scale-95",
            // Focus accessibility
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl p-2 -m-2"
          )}>
            {/* Logo Container with Enhanced Gradient */}
            <div className="relative">
              <div className={cn(
                // Size and shape
                "w-10 h-10 rounded-xl flex items-center justify-center",
                // Enhanced gradient
                "bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600",
                // Shadow and glow
                "shadow-lg shadow-blue-500/25",
                // Transitions
                "transition-all duration-300 ease-out",
                "group-hover:shadow-xl group-hover:shadow-blue-500/30",
                "group-hover:scale-110"
              )}>
                <Image 
                  src="/logo.svg" 
                  alt="TheTruthSchool Logo" 
                  width={24} 
                  height={20}
                  className="filter brightness-0 invert transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              
              {/* Animated Glow Effect */}
              <div className={cn(
                "absolute inset-0 rounded-xl blur-lg opacity-0 -z-10",
                "bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600",
                "group-hover:opacity-40 transition-opacity duration-300"
              )} />
            </div>

            {/* Brand Text with Typography Enhancement */}
            <div className="brand-text">
              <h2 className={cn(
                // Typography
                "text-xl font-bold leading-tight",
                // Enhanced gradient text
                "bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300",
                "group-hover:from-blue-600 group-hover:to-purple-600",
                "dark:group-hover:from-blue-400 dark:group-hover:to-purple-400",
                "bg-clip-text text-transparent",
                // Transitions
                "transition-all duration-300"
              )}>
                TheTruthSchool
              </h2>
              <p className={cn(
                "text-xs font-medium leading-none",
                "text-gray-500 dark:text-white/50",
                "group-hover:text-blue-500 dark:group-hover:text-blue-400",
                "transition-colors duration-300",
                "hidden sm:block"
              )}>
                AI Interview Prep
              </p>
            </div>
          </Link>

          {/* Enhanced Navigation Menu */}
          <div className={cn(
            // Layout
            "flex items-center gap-1 sm:gap-2",
            // Background with glassmorphism
            "bg-gray-100/50 dark:bg-white/5",
            "backdrop-blur-sm rounded-2xl p-1",
            "border border-gray-200/50 dark:border-white/10"
          )}>
            
            {/* Navigation Items */}
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    // Base layout
                    "flex items-center gap-2 px-3 py-2 rounded-xl",
                    "text-sm font-medium transition-all duration-300 ease-out",
                    "relative overflow-hidden group",
                    // Active/inactive states
                    isActive
                      ? cn(
                          "bg-white dark:bg-white/10",
                          "text-gray-900 dark:text-white",
                          "shadow-md shadow-black/5 dark:shadow-black/20"
                        )
                      : cn(
                          "text-gray-600 dark:text-white/70",
                          "hover:text-gray-900 dark:hover:text-white",
                          "hover:bg-white/50 dark:hover:bg-white/5"
                        ),
                    // Focus accessibility
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Icon */}
                  <span className={cn(
                    "transition-transform duration-300",
                    "group-hover:scale-110",
                    isActive && "text-blue-600 dark:text-blue-400"
                  )}>
                    {item.icon}
                  </span>
                  
                  {/* Label */}
                  <span className="nav-text hidden sm:inline">
                    {item.label}
                  </span>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className={cn(
                      "bottom-105 left-1/2 transform -translate-x-1/2",
                      "w-1 h-5 bg-blue-500 rounded-full",
                      "animate-scale-in"
                    )} />
                  )}
                </Link>
              );
            })}

            {/* Visual Divider */}
            <div className={cn(
              "w-px h-6 mx-1",
              "bg-gray-300 dark:bg-white/20"
            )} />

            {/* Theme Toggle Button
            <button
              onClick={toggleTheme}
              className={cn(
                // Layout
                "flex items-center justify-center w-9 h-9 rounded-xl",
                // Background and borders
                "bg-gray-100 dark:bg-white/10",
                "border border-gray-200 dark:border-white/20",
                // Interactive states
                "hover:bg-gray-200 dark:hover:bg-white/20",
                "active:scale-95 transition-all duration-200",
                // Focus accessibility
                "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              )}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button> */}

            {/* Enhanced Profile Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={cn(
                  // Layout
                  "flex items-center justify-center w-9 h-9 rounded-xl",
                  // Background with gradient
                  "bg-gradient-to-br from-gray-100 to-gray-50",
                  "dark:from-white/20 dark:to-white/10",
                  "border border-gray-200 dark:border-white/20",
                  // Interactive states
                  "hover:from-gray-200 hover:to-gray-100",
                  "dark:hover:from-white/30 dark:hover:to-white/20",
                  "active:scale-95 transition-all duration-200",
                  // Focus accessibility
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                )}
                aria-label="User profile menu"
                aria-expanded={isProfileOpen}
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt="Profile"
                    width={20}
                    height={20}
                    className="rounded-lg"
                  />
                ) : (
                  <svg className="w-4 h-4 text-gray-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className={cn(
                  // Position
                  "absolute top-full right-0 mt-2 w-48",
                  // Apple glassmorphism
                  "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl",
                  "border border-gray-200 dark:border-white/20",
                  "rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40",
                  // Animation
                  "animate-scale-in origin-top-right",
                  // Z-index
                  "z-50"
                )}>
                  <div className="p-2">
                    {user && (
                      <div className="px-3 py-2 border-b border-gray-200 dark:border-white/10 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/60">
                          Signed in
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onSignOut?.();
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm rounded-lg",
                        "text-red-600 dark:text-red-400",
                        "hover:bg-red-50 dark:hover:bg-red-500/10",
                        "transition-colors duration-200"
                      )}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Background Blur Layer */}
        <div className={cn(
          "absolute inset-0 -z-10",
          "bg-gradient-to-r from-white/90 via-white/95 to-white/90",
          "dark:from-black/90 dark:via-black/95 dark:to-black/90",
          "backdrop-blur-xl"
        )} />
      </nav>

      {/* Click outside to close profile dropdown */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default AppleNavbar;