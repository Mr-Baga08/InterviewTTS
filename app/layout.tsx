import { Toaster } from "sonner";
import type { Metadata, Viewport } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";

// Enhanced font configuration with better performance
const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
  preload: true,
  fallback: [
    "system-ui", 
    "-apple-system", 
    "BlinkMacSystemFont", 
    "Segoe UI", 
    "Roboto", 
    "sans-serif"
  ],
});
 
// Enhanced metadata with better SEO and social sharing
export const metadata: Metadata = {
  title: {
    default: "TheTruthSchool.ai - AI-Powered Interview Preparation",
    template: "%s | TheTruthSchool.ai",
  },
  description:
    "Master your interviews with AI-powered practice sessions. Get personalized feedback, improve your skills, and land your dream job with TheTruthSchool.ai - the future of interview preparation.",
  keywords: [
    "interview preparation",
    "AI interview practice",
    "mock interviews",
    "job interview training",
    "interview feedback",
    "career preparation",
    "interview coaching",
    "AI assessment",
  ],
  authors: [{ name: "TheTruthSchool.ai Team" }],
  creator: "TheTruthSchool.ai",
  publisher: "TheTruthSchool.ai",
  
  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thetruthschool.ai",
    siteName: "TheTruthSchool.ai",
    title: "TheTruthSchool.ai - AI-Powered Interview Preparation",
    description:
      "Master your interviews with AI-powered practice sessions. Get personalized feedback and land your dream job.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TheTruthSchool.ai - AI Interview Preparation Platform",
        type: "image/png",
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    site: "@thetruthschool",
    creator: "@thetruthschool",
    title: "TheTruthSchool.ai - AI-Powered Interview Preparation",
    description:
      "Master your interviews with AI-powered practice sessions. Get personalized feedback and land your dream job.",
    images: ["/twitter-card.png"],
  },

  // Apple Web App configuration
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TheTruthSchool",
    startupImage: [
      {
        url: "/apple-splash-2048-2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/apple-splash-1668-2388.png", 
        media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/apple-splash-1536-2048.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/apple-splash-1284-2778.png",
        media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/apple-splash-1170-2532.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
      {
        url: "/apple-splash-1125-2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },

  // Enhanced app configuration
  applicationName: "TheTruthSchool.ai",
  category: "education",
  classification: "Business",
  
  // Format detection
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },

  // Enhanced icons configuration
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon-57x57.png", sizes: "57x57" },
      { url: "/apple-touch-icon-60x60.png", sizes: "60x60" },
      { url: "/apple-touch-icon-72x72.png", sizes: "72x72" },
      { url: "/apple-touch-icon-76x76.png", sizes: "76x76" },
      { url: "/apple-touch-icon-114x114.png", sizes: "114x114" },
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120" },
      { url: "/apple-touch-icon-144x144.png", sizes: "144x144" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152" },
      { url: "/apple-touch-icon-180x180.png", sizes: "180x180" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#3b82f6",
      },
    ],
  },

  // Manifest link
  manifest: "/manifest.json",

  // Robot instructions
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Verification for search engines
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
    },
  },
};

// Enhanced viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  colorScheme: "dark light",
};

// Theme detection and initialization script
const ThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            var theme = localStorage.getItem('theme');
            var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            var shouldBeDark = theme === 'dark' || (theme === null && systemPrefersDark);
            
            if (shouldBeDark) {
              document.documentElement.classList.add('dark');
              document.documentElement.style.colorScheme = 'dark';
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.style.colorScheme = 'light';
            }
          } catch (e) {
            console.warn('Theme initialization failed:', e);
          }
        })();
      `,
    }}
  />
);

// Performance monitoring script
const PerformanceScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        if (typeof window !== 'undefined' && window.performance) {
          window.addEventListener('load', function() {
            setTimeout(function() {
              const perfData = performance.getEntriesByType('navigation')[0];
              if (perfData && perfData.loadEventEnd - perfData.loadEventStart > 0) {
                console.log('Page load time:', Math.round(perfData.loadEventEnd - perfData.loadEventStart), 'ms');
              }
            }, 0);
          });
        }
      `,
    }}
  />
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark color-scheme-dark" suppressHydrationWarning>
      <head>
        {/* Theme initialization - must be first to prevent FOUC */}
        <ThemeScript />
        
        {/* Enhanced meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Preconnect for critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical resource hints */}
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/robot.png" as="image" type="image/png" />
        
        {/* Enhanced security headers via meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
        
        {/* Performance monitoring */}
        {process.env.NODE_ENV === 'development' && <PerformanceScript />}
      </head>
      <body
        className={`${monaSans.variable} font-sans antialiased pattern apple-layout`}
        suppressHydrationWarning
      >
        {/* Enhanced background system */}
        <div className="fixed inset-0 -z-50">
          {/* Primary gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
          
          {/* Animated gradient orbs for depth */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-apple-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl animate-apple-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 rounded-full blur-2xl animate-apple-pulse" style={{ animationDelay: '4s' }} />
          
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.015] bg-noise" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-apple-grid opacity-[0.02]" />
        </div>

        {/* Main content wrapper with enhanced structure */}
        <div className="relative min-h-screen overflow-x-hidden">
          {/* Safe area top spacer */}
          <div className="h-safe-top bg-transparent" />
          
          {/* Main content area */}
          <main className="relative z-10 min-h-screen pb-safe-bottom">
            {/* Skip to main content link for accessibility */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
            >
              Skip to main content
            </a>
            
            {/* Content wrapper */}
            <div id="main-content">
              {children}
            </div>
          </main>

          {/* Global loading indicator */}
          <div
            id="global-loading"
            className="fixed top-4 right-4 z-50 hidden"
            role="status"
            aria-label="Loading"
          >
            <div className="apple-glass rounded-lg p-3">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          </div>
        </div>

        {/* Enhanced Toast configuration */}
        <Toaster
          position="top-center"
          expand={true}
          richColors={true}
          closeButton={true}
          duration={4000}
          toastOptions={{
            style: {
              background: "rgba(30, 30, 30, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              backdropFilter: "blur(20px)",
              borderRadius: "12px",
              boxShadow: "var(--shadow-apple-lg)",
              fontSize: "14px",
              fontWeight: "500",
            },
            className: "apple-glass",
            actionButtonStyle: {
              backgroundColor: "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontWeight: "600",
              fontSize: "13px",
            },
            cancelButtonStyle: {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "8px 16px",
              fontWeight: "500",
              fontSize: "13px",
            },
          }}
        />

        {/* Service Worker registration script */}
        <script
  dangerouslySetInnerHTML={{
    __html: `
      // Only register service worker in production and if supported
      if ('serviceWorker' in navigator && '${process.env.NODE_ENV}' === 'production') {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          })
          .then(function(registration) {
            console.log('✅ SW registered successfully:', registration.scope);
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker is installed, prompt user to reload
                    if (confirm('A new version is available. Reload to update?')) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    }
                  }
                });
              }
            });
            
            // Handle service worker updates
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              if (!refreshing) {
                refreshing = true;
                window.location.reload();
              }
            });
          })
          .catch(function(error) {
            console.warn('⚠️ SW registration failed:', error);
            // Don't show errors to users, just log for debugging
          });
        });
        
        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'CACHE_UPDATED') {
            console.log('📦 Cache updated by service worker');
          }
        });
      } else {
        console.log('ℹ️ Service worker not registered (development mode or not supported)');
      }
    `,
  }}
/>

        {/* Analytics script placeholder */}
        {process.env.NEXT_PUBLIC_ANALYTICS_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_ANALYTICS_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_ANALYTICS_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}