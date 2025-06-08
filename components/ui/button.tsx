import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    // Enhanced base styles with Apple design system
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
    // Enhanced states with better accessibility
    "disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed disabled:saturate-50",
    // Improved icon styles
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200",
    // Enhanced focus styles for better accessibility
    "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-offset-2",
    // Apple-style interactions
    "active:scale-[0.97] active:transition-transform active:duration-100",
    "hover:-translate-y-0.5 hover:shadow-lg",
    // Position for advanced effects
    "relative overflow-hidden isolate",
    // Enhanced touch targets for mobile
    "touch-manipulation select-none",
    // Performance optimizations
    "will-change-transform backface-hidden",
  ],
  {
    variants: {
      variant: {
        default: [
          // Enhanced Apple gradient with interview theme
          "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg",
          "hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 hover:shadow-xl",
          "active:from-blue-800 active:via-indigo-800 active:to-purple-800",
          "focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
          "shadow-[0_4px_24px_rgba(59,130,246,0.25)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.35)]",
          // Enhanced shimmer effect
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-out",
          "hover:before:translate-x-[100%]",
          // Subtle inner glow
          "after:absolute after:inset-[1px] after:rounded-[inherit] after:bg-gradient-to-b after:from-white/10 after:to-transparent after:pointer-events-none",
        ],
        
        destructive: [
          "bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white shadow-lg",
          "hover:from-red-700 hover:via-rose-700 hover:to-pink-700 hover:shadow-xl",
          "active:from-red-800 active:via-rose-800 active:to-pink-800",
          "focus-visible:ring-red-500/50 focus-visible:ring-offset-2",
          "shadow-[0_4px_24px_rgba(239,68,68,0.25)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.35)]",
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-out",
          "hover:before:translate-x-[100%]",
          "after:absolute after:inset-[1px] after:rounded-[inherit] after:bg-gradient-to-b after:from-white/10 after:to-transparent after:pointer-events-none",
        ],

        success: [
          "bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg",
          "hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 hover:shadow-xl",
          "active:from-green-800 active:via-emerald-800 active:to-teal-800",
          "focus-visible:ring-green-500/50 focus-visible:ring-offset-2",
          "shadow-[0_4px_24px_rgba(34,197,94,0.25)] hover:shadow-[0_8px_32px_rgba(34,197,94,0.35)]",
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-out",
          "hover:before:translate-x-[100%]",
          "after:absolute after:inset-[1px] after:rounded-[inherit] after:bg-gradient-to-b after:from-white/10 after:to-transparent after:pointer-events-none",
        ],

        warning: [
          "bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white shadow-lg",
          "hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 hover:shadow-xl",
          "active:from-amber-700 active:via-orange-700 active:to-yellow-700",
          "focus-visible:ring-amber-500/50 focus-visible:ring-offset-2",
          "shadow-[0_4px_24px_rgba(245,158,11,0.25)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.35)]",
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-out",
          "hover:before:translate-x-[100%]",
          "after:absolute after:inset-[1px] after:rounded-[inherit] after:bg-gradient-to-b after:from-white/10 after:to-transparent after:pointer-events-none",
        ],

        premium: [
          "bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white shadow-lg",
          "hover:from-purple-700 hover:via-violet-700 hover:to-fuchsia-700 hover:shadow-xl",
          "active:from-purple-800 active:via-violet-800 active:to-fuchsia-800",
          "focus-visible:ring-purple-500/50 focus-visible:ring-offset-2",
          "shadow-[0_4px_24px_rgba(139,92,246,0.25)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.35)]",
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-out",
          "hover:before:translate-x-[100%]",
          "after:absolute after:inset-[1px] after:rounded-[inherit] after:bg-gradient-to-b after:from-white/10 after:to-transparent after:pointer-events-none",
        ],

        // Interview app specific variants
        interview: [
          "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg",
          "hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 hover:shadow-xl",
          "active:from-cyan-800 active:via-blue-800 active:to-indigo-800",
          "focus-visible:ring-cyan-500/50 focus-visible:ring-offset-2",
          "shadow-[0_4px_24px_rgba(6,182,212,0.25)] hover:shadow-[0_8px_32px_rgba(6,182,212,0.35)]",
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 before:ease-out",
          "hover:before:translate-x-[100%]",
          "after:absolute after:inset-[1px] after:rounded-[inherit] after:bg-gradient-to-b after:from-white/10 after:to-transparent after:pointer-events-none",
        ],

        // Enhanced glassmorphism variants
        outline: [
          "border border-white/20 bg-white/5 backdrop-blur-xl text-white shadow-lg",
          "hover:bg-white/10 hover:border-white/30 hover:shadow-xl",
          "active:bg-white/15 active:scale-[0.98]",
          "focus-visible:ring-white/50 focus-visible:ring-offset-2",
          "dark:border-white/10 dark:bg-white/5",
          "dark:hover:bg-white/10 dark:hover:border-white/20",
          "dark:active:bg-white/15",
          // Glassmorphism effects
          "before:absolute before:inset-[1px] before:rounded-[inherit] before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none",
        ],

        secondary: [
          "bg-white/10 backdrop-blur-xl text-white border border-white/20 shadow-lg",
          "hover:bg-white/15 hover:border-white/30 hover:shadow-xl",
          "active:bg-white/20 active:scale-[0.98]",
          "focus-visible:ring-white/50 focus-visible:ring-offset-2",
          "dark:bg-white/5 dark:border-white/10",
          "dark:hover:bg-white/10 dark:hover:border-white/20",
          "dark:active:bg-white/15",
          // Enhanced glassmorphism
          "before:absolute before:inset-[1px] before:rounded-[inherit] before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none",
        ],

        ghost: [
          "text-white/80 border border-transparent",
          "hover:bg-white/10 hover:backdrop-blur-xl hover:text-white",
          "active:bg-white/15 active:scale-[0.98]",
          "focus-visible:ring-white/50 focus-visible:ring-offset-2",
          "dark:text-white/70",
          "dark:hover:bg-white/10 dark:hover:text-white",
          "dark:active:bg-white/15",
        ],

        link: [
          "text-blue-400 underline-offset-4 hover:underline",
          "focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
          "hover:text-blue-300 active:text-blue-200",
          "dark:text-blue-400 dark:hover:text-blue-300 dark:active:text-blue-200",
          // Enhanced link styling
          "relative before:absolute before:bottom-0 before:left-0 before:w-0 before:h-[2px] before:bg-current before:transition-all before:duration-300",
          "hover:before:w-full",
        ],
      },

      size: {
        xs: "h-7 px-2 text-xs rounded-lg gap-1 min-w-[1.75rem] has-[>svg]:px-1.5",
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5 min-w-[2rem] has-[>svg]:px-2.5",
        default: "h-10 px-4 py-2 text-sm rounded-xl gap-2 min-w-[2.5rem] has-[>svg]:px-3",
        lg: "h-12 px-6 text-base rounded-xl gap-2 min-w-[3rem] has-[>svg]:px-5",
        xl: "h-14 px-8 text-lg rounded-2xl gap-3 min-w-[3.5rem] has-[>svg]:px-7",
        "2xl": "h-16 px-10 text-xl rounded-2xl gap-4 min-w-[4rem] has-[>svg]:px-9",
        
        // Icon-only variants
        icon: "size-10 rounded-xl p-0",
        "icon-sm": "size-8 rounded-lg p-0",
        "icon-lg": "size-12 rounded-xl p-0",
        "icon-xl": "size-14 rounded-2xl p-0",
        
        // Mobile-optimized sizes
        "touch": "h-12 px-6 text-base rounded-xl gap-2 min-w-[3rem] has-[>svg]:px-5", // 44px+ for touch
      },

      loading: {
        true: "cursor-wait",
        false: "",
      },

      // New props for enhanced functionality
      fullWidth: {
        true: "w-full",
        false: "",
      },

      elevated: {
        true: "shadow-2xl hover:shadow-3xl",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
      fullWidth: false,
      elevated: false,
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loadingText?: string
  pulse?: boolean
  ripple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      loadingText,
      pulse = false,
      ripple = false,
      fullWidth,
      elevated,
      onClick,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const isDisabled = disabled || loading
    const [rippleElements, setRippleElements] = React.useState<Array<{ id: string; x: number; y: number }>>([])

    // Enhanced ripple effect
    const handleClick = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !isDisabled) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now().toString()
        
        setRippleElements(prev => [...prev, { id, x, y }])
        
        setTimeout(() => {
          setRippleElements(prev => prev.filter(ripple => ripple.id !== id))
        }, 600)
      }
      
      onClick?.(e)
    }, [ripple, isDisabled, onClick])

    // Enhanced loading spinner
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, loading, fullWidth, elevated, className }),
          pulse && "animate-pulse",
          ripple && "overflow-hidden"
        )}
        disabled={isDisabled}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effect */}
        {ripple && rippleElements.map(({ id, x, y }) => (
          <span
            key={id}
            className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
            style={{
              left: x - 10,
              top: y - 10,
              width: 20,
              height: 20,
              animationDuration: '600ms',
              animationIterationCount: 1,
            }}
          />
        ))}

        {/* Loading state */}
        {loading && (
          <>
            <LoadingSpinner />
            {loadingText && (
              <span className="relative z-10 opacity-70">{loadingText}</span>
            )}
          </>
        )}

        {/* Normal state */}
        {!loading && (
          <>
            {leftIcon && (
              <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                {leftIcon}
              </span>
            )}
            
            <span className={cn(
              "relative z-10 transition-all duration-200",
              loading && "opacity-70"
            )}>
              {children}
            </span>
            
            {rightIcon && (
              <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </Comp>
    )
  }
)

Button.displayName = "Button"

// Enhanced button with specific use cases
const CallButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <Button 
      ref={ref}
      variant="success"
      size="lg"
      elevated
      ripple
      {...props}
    >
      {children}
    </Button>
  )
)

const DisconnectButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <Button 
      ref={ref}
      variant="destructive"
      size="lg"
      elevated
      ripple
      {...props}
    >
      {children}
    </Button>
  )
)

const InterviewButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <Button 
      ref={ref}
      variant="interview"
      size="lg"
      elevated
      ripple
      {...props}
    >
      {children}
    </Button>
  )
)

CallButton.displayName = "CallButton"
DisconnectButton.displayName = "DisconnectButton"
InterviewButton.displayName = "InterviewButton"

export { 
  Button, 
  CallButton, 
  DisconnectButton, 
  InterviewButton,
  buttonVariants, 
  type ButtonProps 
}