import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-mona-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        // Shadcn/ui colors with enhanced CSS variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          100: "#e0f2fe",
          200: "#bae6fd",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom app colors for backward compatibility
        "user-primary": "#3b82f6",
        "primary-100": "#e0f2fe",
        "primary-200": "#bae6fd",
        "dark-300": "#374151",
        // Enhanced interview app color palette
        "interview-primary": "#3b82f6",
        "interview-secondary": "#8b5cf6",
        "interview-accent": "#06b6d4",
        "apple-blue": {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        "apple-gray": {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Additional Apple-inspired radii
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
      // Enhanced animations for the Apple-inspired design
      animation: {
        // Apple-style animations
        "apple-fade": "apple-fade-in 0.6s ease-out forwards",
        "apple-slide": "apple-slide-up 0.8s ease-out forwards",
        "apple-zoom": "apple-zoom-in 0.6s ease-out forwards",
        "apple-float": "apple-float 12s ease-in-out infinite",
        "apple-pulse": "apple-pulse 3s ease-in-out infinite",
        "apple-breathe": "apple-breathe 4s ease-in-out infinite",
        // Interview app specific animations
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "subtle-glow": "subtle-glow 3s ease-in-out infinite",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
        // Utility animations
        float: "float 6s ease-in-out infinite",
        "fade-in": "fade-in 0.2s ease-out forwards",
        "slide-down": "slide-down 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        shake: "shake 0.4s ease-in-out",
        "label-glow": "label-glow 2s ease-in-out infinite",
      },
      keyframes: {
        // Apple-style keyframes
        "apple-fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px) scale(0.98)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        "apple-slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(40px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "apple-zoom-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95) translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) translateY(0)",
          },
        },
        "apple-float": {
          "0%, 100%": {
            transform: "translateY(0px) rotate(0deg)",
            opacity: "0.3",
          },
          "25%": {
            transform: "translateY(-12px) rotate(90deg)",
            opacity: "0.5",
          },
          "50%": {
            transform: "translateY(-20px) rotate(180deg)",
            opacity: "0.7",
          },
          "75%": {
            transform: "translateY(-12px) rotate(270deg)",
            opacity: "0.5",
          },
        },
        "apple-pulse": {
          "0%, 100%": {
            opacity: "0.6",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.05)",
          },
        },
        "apple-breathe": {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "0.8",
          },
          "50%": {
            transform: "scale(1.02)",
            opacity: "1",
          },
        },
        // Interview app specific keyframes
        "pulse-glow": {
          "0%, 100%": {
            opacity: "0.3",
          },
          "50%": {
            opacity: "0.6",
          },
        },
        "subtle-glow": {
          "0%, 100%": {
            opacity: "0.4",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "0.8",
            transform: "scale(1.02)",
          },
        },
        "pulse-slow": {
          "0%, 100%": {
            opacity: "0.6",
          },
          "50%": {
            opacity: "1",
          },
        },
        // Utility keyframes
        float: {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(4px) scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)",
          },
        },
        "slide-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-8px)",
            maxHeight: "0",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
            maxHeight: "100px",
          },
        },
        "scale-in": {
          "0%": {
            transform: "scale(0) rotate(180deg)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1) rotate(0deg)",
            opacity: "1",
          },
        },
        shake: {
          "0%, 100%": {
            transform: "translateX(0)",
          },
          "25%": {
            transform: "translateX(-4px)",
          },
          "75%": {
            transform: "translateX(4px)",
          },
        },
        "label-glow": {
          "0%, 100%": {
            textShadow: "0 0 0 transparent",
          },
          "50%": {
            textShadow: "0 0 8px rgba(59, 130, 246, 0.3)",
          },
        },
      },
      // Enhanced backdrop blur
      backdropBlur: {
        xs: "2px",
        apple: "20px",
      },
      // Apple-inspired box shadows
      boxShadow: {
        "apple-sm": "0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.06)",
        "apple-md": "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.08)",
        "apple-lg": "0 10px 32px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)",
        "apple-xl": "0 20px 64px rgba(0, 0, 0, 0.2), 0 8px 32px rgba(0, 0, 0, 0.12)",
        "apple-premium": "0 25px 80px rgba(0, 0, 0, 0.25), 0 12px 32px rgba(0, 0, 0, 0.15), 0 2px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        // Glassmorphism shadows
        "glass": "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 16px rgba(0, 0, 0, 0.08)",
      },
      // Enhanced spacing scale
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      // Enhanced z-index scale
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
      // Enhanced transition timing functions
      transitionTimingFunction: {
        "apple": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "apple-sharp": "cubic-bezier(0.4, 0, 0.2, 1)",
        "apple-smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      // Enhanced screen sizes for better responsive design
      screens: {
        "xs": "475px",
        "3xl": "1680px",
        "4xl": "2560px",
      },
      // Enhanced line height scale
      lineHeight: {
        "12": "3rem",
        "16": "4rem",
      },
      // Enhanced font sizes for Apple-like typography
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      // Enhanced grid template columns
      gridTemplateColumns: {
        "16": "repeat(16, minmax(0, 1fr))",
        "20": "repeat(20, minmax(0, 1fr))",
      },
      // Content visibility for performance
      content: {
        empty: "''",
      },
    },
  },
  plugins: [],
  // Future-proofing for Tailwind CSS v4
  future: {
    hoverOnlyWhenSupported: true,
  },
  // Experimental features
  experimental: {
    optimizeUniversalDefaults: true,
  },
};

export default config;