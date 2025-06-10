"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Enhanced label variants with Apple-inspired design
const labelVariants = cva(
  [
    // Base styles with Apple design principles
    "leading-none select-none transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
    // Enhanced disabled states
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-disabled:saturate-50",
    "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
    // Interaction states
    "cursor-pointer active:scale-[0.98]",
    // Enhanced typography
    "font-feature-settings: 'kern' 1, 'liga' 1",
  ],
  {
    variants: {
      variant: {
        default: [
          "text-gray-900 dark:text-gray-100",
          "hover:text-gray-700 dark:hover:text-gray-200",
        ],
        
        muted: [
          "text-gray-600 dark:text-gray-400",
          "hover:text-gray-700 dark:hover:text-gray-300",
        ],
        
        accent: [
          "text-blue-600 dark:text-blue-400",
          "hover:text-blue-700 dark:hover:text-blue-300",
        ],
        
        success: [
          "text-green-600 dark:text-green-400",
          "hover:text-green-700 dark:hover:text-green-300",
        ],
        
        error: [
          "text-red-600 dark:text-red-400",
          "hover:text-red-700 dark:hover:text-red-300",
        ],
        
        warning: [
          "text-amber-600 dark:text-amber-400",
          "hover:text-amber-700 dark:hover:text-amber-300",
        ],
        
        // Interview app specific variant
        interview: [
          "text-indigo-600 dark:text-indigo-400",
          "hover:text-indigo-700 dark:hover:text-indigo-300",
        ],
      },
      
      size: {
        xs: "text-xs font-medium",
        sm: "text-sm font-medium",
        default: "text-sm font-medium",
        lg: "text-base font-semibold",
        xl: "text-lg font-semibold",
      },
      
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      
      state: {
        default: "",
        focused: "text-blue-600 dark:text-blue-400",
        error: "text-red-600 dark:text-red-400",
        success: "text-green-600 dark:text-green-400",
        disabled: "opacity-50 cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      weight: "medium",
      state: "default",
    },
  }
)

interface LabelProps
  extends React.ComponentProps<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean
  optional?: boolean
  tooltip?: string
  description?: string
  icon?: React.ReactNode
  badge?: string | number
  animate?: boolean
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(
  (
    {
      className,
      variant,
      size,
      weight,
      state,
      required,
      optional,
      tooltip,
      description,
      icon,
      badge,
      animate = true,
      children,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const [showTooltip, setShowTooltip] = React.useState(false)

    const handleMouseEnter = React.useCallback(() => {
      setIsHovered(true)
      if (tooltip) {
        setShowTooltip(true)
      }
    }, [tooltip])

    const handleMouseLeave = React.useCallback(() => {
      setIsHovered(false)
      setShowTooltip(false)
    }, [])

    return (
      <div className="relative inline-flex items-center">
        <LabelPrimitive.Root
          ref={ref}
          data-slot="label"
          data-state={state}
          data-hovered={isHovered}
          className={cn(
            labelVariants({ variant, size, weight, state }),
            animate && "transition-all duration-200",
            className
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...props}
        >
          <span className="flex items-center gap-2">
            {/* Icon */}
            {icon && (
              <span className={cn(
                "inline-flex items-center justify-center transition-transform duration-200",
                isHovered && animate && "scale-110",
                size === "xs" && "w-3 h-3",
                size === "sm" && "w-3.5 h-3.5",
                size === "default" && "w-4 h-4",
                size === "lg" && "w-5 h-5",
                size === "xl" && "w-6 h-6"
              )}>
                {icon}
              </span>
            )}
            
            {/* Main label text */}
            <span className={cn(
              "relative",
              animate && "transition-all duration-200",
              isHovered && animate && "transform translate-x-0.5"
            )}>
              {children}
            </span>
            
            {/* Required indicator */}
            {required && (
              <span 
                className={cn(
                  "text-red-500 transition-all duration-200",
                  animate && isHovered && "scale-125 text-red-600",
                  size === "xs" && "text-xs",
                  size === "sm" && "text-xs",
                  size === "default" && "text-sm",
                  size === "lg" && "text-base",
                  size === "xl" && "text-lg"
                )}
                aria-label="required field"
              >
                *
              </span>
            )}
            
            {/* Optional indicator */}
            {optional && !required && (
              <span className={cn(
                "text-gray-400 dark:text-gray-500 font-normal transition-colors duration-200",
                isHovered && "text-gray-500 dark:text-gray-400",
                size === "xs" && "text-xs",
                size === "sm" && "text-xs",
                size === "default" && "text-xs",
                size === "lg" && "text-sm",
                size === "xl" && "text-base"
              )}>
                (optional)
              </span>
            )}
            
            {/* Badge */}
            {badge && (
              <span className={cn(
                "inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium rounded-full",
                "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                "transition-transform duration-200",
                animate && isHovered && "scale-110"
              )}>
                {badge}
              </span>
            )}
            
            {/* Tooltip indicator */}
            {tooltip && (
              <span className={cn(
                "inline-flex items-center justify-center w-4 h-4 rounded-full",
                "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
                "hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 cursor-help",
                size === "xs" && "w-3 h-3",
                size === "sm" && "w-3.5 h-3.5",
                size === "lg" && "w-5 h-5",
                size === "xl" && "w-6 h-6"
              )}>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            )}
          </span>
        </LabelPrimitive.Root>

        {/* Tooltip */}
        {tooltip && showTooltip && (
          <div className={cn(
            "absolute bottom-full left-0 mb-2 z-50",
            "px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700",
            "rounded-lg shadow-lg border border-gray-200 dark:border-gray-600",
            "opacity-0 animate-fade-in",
            "max-w-xs whitespace-normal break-words"
          )}>
            {tooltip}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </div>
        )}

        {/* Description (appears below label) */}
        {description && (
          <div className={cn(
            "absolute top-full left-0 mt-1 w-full",
            "text-xs text-gray-500 dark:text-gray-400 leading-relaxed",
            "opacity-0 transform translate-y-1 transition-all duration-200",
            isHovered && "opacity-100 transform translate-y-0"
          )}>
            {description}
          </div>
        )}
      </div>
    )
  }
)

Label.displayName = "Label"

// Specialized label components for common use cases
const RequiredLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  Omit<LabelProps, "required">
>(({ children, ...props }, ref) => (
  <Label ref={ref} required {...props}>
    {children}
  </Label>
))

const OptionalLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  Omit<LabelProps, "optional">
>(({ children, ...props }, ref) => (
  <Label ref={ref} optional {...props}>
    {children}
  </Label>
))

const IconLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ icon, children, ...props }, ref) => (
  <Label ref={ref} icon={icon} {...props}>
    {children}
  </Label>
))

const InterviewLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  Omit<LabelProps, "variant">
>(({ children, ...props }, ref) => (
  <Label ref={ref} variant="interview" {...props}>
    {children}
  </Label>
))

RequiredLabel.displayName = "RequiredLabel"
OptionalLabel.displayName = "OptionalLabel"
IconLabel.displayName = "IconLabel"
InterviewLabel.displayName = "InterviewLabel"

export { 
  Label, 
  RequiredLabel, 
  OptionalLabel, 
  IconLabel, 
  InterviewLabel,
  labelVariants,
  type LabelProps 
}

