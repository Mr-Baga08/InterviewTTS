import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Enhanced input variants with Apple-inspired design
const inputVariants = cva(
  [
    // Base styles with Apple design principles
    "flex w-full rounded-xl border transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
    "placeholder:transition-colors placeholder:duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    // Enhanced disabled states
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50",
    // File input enhancements
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:mr-4 file:py-1 file:px-2 file:rounded-lg file:cursor-pointer",
    "file:bg-blue-50 file:text-blue-700 file:hover:bg-blue-100 file:transition-colors",
    "dark:file:bg-blue-950 dark:file:text-blue-300 dark:file:hover:bg-blue-900",
    // Enhanced selection
    "selection:bg-blue-500/20 selection:text-blue-900",
    // Performance optimizations
    "will-change-transform backface-hidden",
    // Touch optimization
    "touch-manipulation",
  ],
  {
    variants: {
      variant: {
        default: [
          // Glassmorphism default style
          "bg-white/80 backdrop-blur-sm border-gray-200/50",
          "hover:bg-white/90 hover:border-gray-300/60",
          "focus:bg-white focus:border-blue-500 focus:ring-blue-500/20",
          "dark:bg-gray-900/80 dark:border-gray-700/50",
          "dark:hover:bg-gray-900/90 dark:hover:border-gray-600/60",
          "dark:focus:bg-gray-900 dark:focus:border-blue-400 dark:focus:ring-blue-400/20",
        ],
        
        filled: [
          // Solid background variant
          "bg-gray-50 border-gray-200",
          "hover:bg-gray-100 hover:border-gray-300",
          "focus:bg-white focus:border-blue-500 focus:ring-blue-500/20",
          "dark:bg-gray-800 dark:border-gray-700",
          "dark:hover:bg-gray-750 dark:hover:border-gray-600",
          "dark:focus:bg-gray-900 dark:focus:border-blue-400 dark:focus:ring-blue-400/20",
        ],
        
        outline: [
          // Outline-only variant
          "bg-transparent border-gray-300",
          "hover:border-gray-400 hover:shadow-sm",
          "focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white/50",
          "dark:border-gray-600",
          "dark:hover:border-gray-500",
          "dark:focus:border-blue-400 dark:focus:ring-blue-400/20 dark:focus:bg-gray-900/50",
        ],
        
        ghost: [
          // Minimal variant
          "bg-transparent border-transparent",
          "hover:bg-gray-50 hover:border-gray-200",
          "focus:bg-white focus:border-blue-500 focus:ring-blue-500/20",
          "dark:hover:bg-gray-900/50 dark:hover:border-gray-700",
          "dark:focus:bg-gray-900 dark:focus:border-blue-400 dark:focus:ring-blue-400/20",
        ],
        
        // Interview app specific variants
        interview: [
          "bg-gradient-to-r from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-blue-200/50",
          "hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300/60",
          "focus:from-white focus:to-white focus:border-blue-500 focus:ring-blue-500/20",
          "dark:from-blue-950/80 dark:to-indigo-950/80 dark:border-blue-800/50",
          "dark:hover:from-blue-950 dark:hover:to-indigo-950 dark:hover:border-blue-700/60",
          "dark:focus:from-gray-900 dark:focus:to-gray-900 dark:focus:border-blue-400 dark:focus:ring-blue-400/20",
        ],
      },
      
      size: {
        sm: "h-9 px-3 py-2 text-xs rounded-lg",
        default: "h-11 px-4 py-3 text-sm rounded-xl",
        lg: "h-12 px-5 py-3 text-base rounded-xl",
        xl: "h-14 px-6 py-4 text-lg rounded-2xl",
      },
      
      state: {
        default: "",
        error: [
          "border-red-500/60 bg-red-50/80 dark:bg-red-950/80 dark:border-red-500/40",
          "focus:border-red-500 focus:ring-red-500/20",
          "dark:focus:border-red-400 dark:focus:ring-red-400/20",
        ],
        success: [
          "border-green-500/60 bg-green-50/80 dark:bg-green-950/80 dark:border-green-500/40",
          "focus:border-green-500 focus:ring-green-500/20",
          "dark:focus:border-green-400 dark:focus:ring-green-400/20",
        ],
        warning: [
          "border-amber-500/60 bg-amber-50/80 dark:bg-amber-950/80 dark:border-amber-500/40",
          "focus:border-amber-500 focus:ring-amber-500/20",
          "dark:focus:border-amber-400 dark:focus:ring-amber-400/20",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
);

interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  loading?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      variant,
      size,
      state,
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      loading,
      clearable,
      onClear,
      value,
      disabled,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState<boolean>(false);
    const [showClear, setShowClear] = React.useState<boolean>(false);

    // Handle clear functionality
    React.useEffect(() => {
      setShowClear(Boolean(clearable && value && !disabled));
    }, [clearable, value, disabled]);

    const handleClear = React.useCallback(() => {
      if (onClear) {
        onClear();
      }
    }, [onClear]);

    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    }, [onFocus]);

    const handleBlur = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    }, [onBlur]);

    // Loading spinner component
    const LoadingSpinner = () => (
      <div className="animate-spin h-4 w-4 text-gray-400">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>
    );

    // Clear button component
    const ClearButton = () => (
      <button
        type="button"
        onClick={handleClear}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="Clear input"
      >
        <svg className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    );

    const hasLeftElement = Boolean(leftIcon || leftAddon);
    const hasRightElement = Boolean(rightIcon || rightAddon || loading || showClear);

    return (
      <div className="relative w-full">
        {/* Left addon (outside border) */}
        {leftAddon && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 pointer-events-none z-10">
            {leftAddon}
          </div>
        )}

        {/* Main input container */}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            data-slot="input"
            data-focused={isFocused}
            data-state={state}
            className={cn(
              inputVariants({ variant, size, state }),
              // Dynamic padding based on icons/addons
              hasLeftElement && size === "sm" && "pl-9",
              hasLeftElement && size === "default" && "pl-10",
              hasLeftElement && size === "lg" && "pl-12",
              hasLeftElement && size === "xl" && "pl-14",
              hasRightElement && size === "sm" && "pr-9",
              hasRightElement && size === "default" && "pr-10",
              hasRightElement && size === "lg" && "pr-12",
              hasRightElement && size === "xl" && "pr-14",
              // Enhanced focus styles
              isFocused && "transform scale-[1.01]",
              // Enhanced placeholder styles
              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              "focus:placeholder:text-gray-400 dark:focus:placeholder:text-gray-500",
              // Color styles
              "text-gray-900 dark:text-gray-100",
              // Prevent zoom on iOS
              type === "email" || type === "tel" || type === "url" ? "text-base sm:text-sm" : "",
              className
            )}
            disabled={disabled || loading}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* Left icon (inside border) */}
          {leftIcon && !leftAddon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <div className={cn(
                "text-gray-400 transition-colors duration-200",
                isFocused && "text-blue-500 dark:text-blue-400",
                state === "error" && "text-red-500",
                state === "success" && "text-green-500",
                state === "warning" && "text-amber-500"
              )}>
                {leftIcon}
              </div>
            </div>
          )}

          {/* Right elements (inside border) */}
          {hasRightElement && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {loading && <LoadingSpinner />}
              {showClear && <ClearButton />}
              {rightIcon && !rightAddon && (
                <div className={cn(
                  "text-gray-400 transition-colors duration-200",
                  isFocused && "text-blue-500 dark:text-blue-400",
                  state === "error" && "text-red-500",
                  state === "success" && "text-green-500",
                  state === "warning" && "text-amber-500"
                )}>
                  {rightIcon}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right addon (outside border) */}
        {rightAddon && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 pointer-events-none z-10">
            {rightAddon}
          </div>
        )}

        {/* Focus ring enhancement */}
        {isFocused && (
          <div 
            className={cn(
              "absolute inset-0 rounded-xl pointer-events-none",
              "ring-2 ring-offset-0",
              state === "error" ? "ring-red-500/20" : 
              state === "success" ? "ring-green-500/20" :
              state === "warning" ? "ring-amber-500/20" :
              "ring-blue-500/20"
            )}
          />
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// Specialized input components for common use cases
const SearchInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "leftIcon" | "type">>(
  ({ placeholder = "Search...", ...props }, ref) => (
    <Input
      ref={ref}
      type="search"
      leftIcon={
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      placeholder={placeholder}
      clearable
      {...props}
    />
  )
);

const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "rightIcon" | "type">>(
  ({ ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState<boolean>(false);

    const togglePasswordVisibility = React.useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);

    return (
      <Input
        ref={ref}
        type={showPassword ? "text" : "password"}
        rightIcon={
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded p-1 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

const EmailInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "leftIcon" | "type">>(
  ({ placeholder = "Enter your email", ...props }, ref) => (
    <Input
      ref={ref}
      type="email"
      leftIcon={
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      }
      placeholder={placeholder}
      {...props}
    />
  )
);

SearchInput.displayName = "SearchInput";
PasswordInput.displayName = "PasswordInput";
EmailInput.displayName = "EmailInput";

export { 
  Input, 
  SearchInput, 
  PasswordInput, 
  EmailInput,
  inputVariants,
  type InputProps 
};