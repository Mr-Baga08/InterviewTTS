import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
    // States
    "disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed",
    // Icon styles
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    // Focus styles
    "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    // Apple-style press animation
    "active:scale-[0.97] active:transition-transform active:duration-100",
    // Hover lift effect
    "hover:-translate-y-0.5 hover:shadow-lg",
    // Position for shimmer effect
    "relative overflow-hidden",
  ],
  {
    variants: {
      variant: {
        default: [
          // Apple blue gradient
          "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white",
          "hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700",
          "active:from-blue-800 active:via-blue-900 active:to-indigo-800",
          "focus-visible:ring-blue-500/50",
          "shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.4)]",
          // Shimmer effect on hover
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out",
        ],
        destructive: [
          "bg-gradient-to-r from-red-600 via-red-700 to-rose-600 text-white",
          "hover:from-red-700 hover:via-red-800 hover:to-rose-700",
          "active:from-red-800 active:via-red-900 active:to-rose-800",
          "focus-visible:ring-red-500/50",
          "shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:shadow-[0_8px_32px_rgba(239,68,68,0.4)]",
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out",
        ],
        outline: [
          "border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-900",
          "hover:bg-white hover:border-gray-300 hover:shadow-md",
          "active:bg-gray-50",
          "focus-visible:ring-gray-500/50",
          "dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-100",
          "dark:hover:bg-gray-900 dark:hover:border-gray-600",
          "dark:active:bg-gray-800",
        ],
        secondary: [
          "bg-gray-100/80 backdrop-blur-sm text-gray-900 border border-gray-200/50",
          "hover:bg-gray-200/80 hover:border-gray-300/50",
          "active:bg-gray-300/80",
          "focus-visible:ring-gray-500/50",
          "dark:bg-gray-800/80 dark:text-gray-100 dark:border-gray-700/50",
          "dark:hover:bg-gray-700/80 dark:hover:border-gray-600/50",
          "dark:active:bg-gray-600/80",
        ],
        ghost: [
          "text-gray-700 border border-transparent",
          "hover:bg-gray-100/80 hover:backdrop-blur-sm",
          "active:bg-gray-200/80",
          "focus-visible:ring-gray-500/50",
          "dark:text-gray-300",
          "dark:hover:bg-gray-800/80",
          "dark:active:bg-gray-700/80",
        ],
        link: [
          "text-blue-600 underline-offset-4 hover:underline",
          "focus-visible:ring-blue-500/50",
          "dark:text-blue-400",
          "hover:text-blue-700 dark:hover:text-blue-300",
          "active:text-blue-800 dark:active:text-blue-200",
        ],
        // New Apple-specific variants
        success: [
          "bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white",
          "hover:from-green-700 hover:via-emerald-700 hover:to-green-800",
          "active:from-green-800 active:via-emerald-800 active:to-green-900",
          "focus-visible:ring-green-500/50",
          "shadow-[0_4px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_8px_32px_rgba(34,197,94,0.4)]",
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out",
        ],
        premium: [
          "bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white",
          "hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700",
          "active:from-purple-800 active:via-violet-800 active:to-indigo-800",
          "focus-visible:ring-purple-500/50",
          "shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.4)]",
          "before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out",
        ],
      },
      size: {
        xs: "h-7 px-2 text-xs rounded-md gap-1 has-[>svg]:px-1.5",
        sm: "h-8 px-3 text-xs rounded-lg gap-1.5 has-[>svg]:px-2.5",
        default: "h-10 px-4 py-2 text-sm rounded-xl gap-2 has-[>svg]:px-3",
        lg: "h-12 px-6 text-base rounded-xl gap-2 has-[>svg]:px-5",
        xl: "h-14 px-8 text-lg rounded-2xl gap-3 has-[>svg]:px-7",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
      loading: {
        true: "cursor-wait",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false,
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
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    
    const isDisabled = disabled || loading

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, loading, className }))}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
        )}
        {!loading && leftIcon && (
          <span className="shrink-0">{leftIcon}</span>
        )}
        <span className={cn(
          "relative z-10",
          loading && "opacity-70"
        )}>
          {children}
        </span>
        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants, type ButtonProps }