import { Toaster } from "sonner";
import type { Metadata, Viewport, ThemeColorDescriptor } from "next";
import { Mona_Sans } from "next/font/google";
import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TheTruthSchool",
  description:
    "A student-focused platform designed to uncover each learner’s true potential through AI-powered assessments, tailored practice, and deep insights.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TheTruthSchool",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json", // ✅ Link to manifest
};

export const themeColor: ThemeColorDescriptor[] = [
  { media: "(prefers-color-scheme: dark)", color: "#000000" },
  { media: "(prefers-color-scheme: light)", color: "#ffffff" },
];

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${monaSans.variable} font-sans antialiased pattern apple-layout`}
        suppressHydrationWarning
      >
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black -z-50" />
        <div className="fixed inset-0 opacity-[0.015] -z-40 bg-noise" />
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="h-safe-top bg-transparent" />
          <main className="relative z-10 min-h-screen pb-safe-bottom">{children}</main>
        </div>

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(30, 30, 30, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              backdropFilter: "blur(20px)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            },
          }}
          closeButton
        />
      </body>
    </html>
  );
}
