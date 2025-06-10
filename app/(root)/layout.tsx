// app/(root)/layout.tsx - Updated with Enhanced Navbar
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import AppleNavbar from "@/components/AppleNavbar";

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();
  
  // Only redirect if user is NOT authenticated
  if (!user) {
    console.log("🔥 RootLayout: User not authenticated, redirecting to sign-in");
    redirect("/sign-in");
  }

  console.log("🔥 RootLayout: User authenticated, rendering protected layout");

  // Server action to handle sign out
  const handleSignOut = async () => {
    "use server";
    await signOut();
    redirect("/sign-in");
  };

  return (
    <div className="apple-root-layout min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Enhanced Apple-style Navigation Bar */}
      <AppleNavbar 
        user={{
          name: user.name,
          avatar: user.avatar
        }}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area with proper spacing */}
      <main className="pt-16 min-h-screen">
        {/* Content wrapper with enhanced styling */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>

        {/* Enhanced Background Elements */}
        <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
          {/* Primary gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-black transition-colors duration-500" />
          
          {/* Animated gradient orbs for depth */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-3xl animate-apple-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 dark:from-purple-500/10 dark:to-indigo-500/10 rounded-full blur-3xl animate-apple-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-500/3 to-cyan-500/3 dark:from-indigo-500/5 dark:to-cyan-500/5 rounded-full blur-2xl animate-apple-pulse" style={{ animationDelay: '4s' }} />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.01] dark:opacity-[0.02]" />
        </div>
      </main>

      {/* Status Bar for iOS-like experience */}
      <div className="fixed bottom-4 right-4 z-30 hidden lg:flex">
        <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-full shadow-lg">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-600 dark:text-white/60 font-medium">AI Ready</span>
        </div>
      </div>
    </div>
  );
};

export default Layout;