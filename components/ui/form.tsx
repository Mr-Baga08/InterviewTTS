"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

// Enhanced useFormField hook with better error handling and state management
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState: globalFormState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  // Enhanced state detection
  const isRequired = globalFormState?.errors?.[fieldContext.name]?.type === 'required'
  const isValid = !fieldState.error && fieldState.isTouched
  const isInvalid = !!fieldState.error && fieldState.isTouched
  const isPending = formState.isSubmitting || formState.isValidating

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    isRequired,
    isValid,
    isInvalid,
    isPending,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

// Enhanced form item variants
const formItemVariants = cva(
  "space-y-3 transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
  {
    variants: {
      variant: {
        default: "space-y-3",
        compact: "space-y-2",
        spacious: "space-y-4",
        inline: "flex items-center space-y-0 space-x-4",
      },
      state: {
        default: "",
        error: "animate-shake",
        success: "relative",
        pending: "opacity-75",
      },
    },
    defaultVariants: {
      variant: "default",
      state: "default",
    },
  }
)

interface FormItemProps 
  extends React.ComponentProps<"div">,
    VariantProps<typeof formItemVariants> {
  showSuccessIcon?: boolean
}

function FormItem({ 
  className, 
  variant, 
  state, 
  showSuccessIcon = true,
  ...props 
}: FormItemProps) {
  const id = React.useId()
  const { isValid, isInvalid, isPending } = useFormField()

  // Auto-detect state if not provided
  const autoState = React.useMemo(() => {
    if (state) return state
    if (isPending) return "pending"
    if (isInvalid) return "error"
    if (isValid) return "success"
    return "default"
  }, [state, isPending, isInvalid, isValid])

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        data-state={autoState}
        className={cn(formItemVariants({ variant, state: autoState }), className)}
        {...props}
      >
        {props.children}
        
        {/* Success indicator */}
        {showSuccessIcon && autoState === "success" && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg 
              className="w-4 h-4 text-green-500 animate-scale-in" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        )}
      </div>
    </FormItemContext.Provider>
  )
}

// Enhanced form label with better styling and state indication
const formLabelVariants = cva(
  "text-sm font-medium leading-none transition-all duration-200 select-none",
  {
    variants: {
      state: {
        default: "text-gray-900 dark:text-gray-100",
        error: "text-red-600 dark:text-red-400",
        success: "text-green-600 dark:text-green-400",
        pending: "text-gray-600 dark:text-gray-400",
      },
      size: {
        sm: "text-xs",
        default: "text-sm", 
        lg: "text-base",
      },
    },
    defaultVariants: {
      state: "default",
      size: "default",
    },
  }
)

interface FormLabelProps
  extends React.ComponentProps<typeof LabelPrimitive.Root>,
    VariantProps<typeof formLabelVariants> {
  required?: boolean
  optional?: boolean
}

function FormLabel({
  className,
  required,
  optional,
  state,
  size,
  children,
  ...props
}: FormLabelProps) {
  const { error, isRequired, isValid, isInvalid, isPending } = useFormField()

  // Auto-detect state if not provided
  const autoState = React.useMemo(() => {
    if (state) return state
    if (isPending) return "pending"
    if (isInvalid) return "error"
    if (isValid) return "success"
    return "default"
  }, [state, isPending, isInvalid, isValid])

  const showRequired = required ?? isRequired
  const showOptional = optional && !showRequired

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      data-state={autoState}
      className={cn(formLabelVariants({ state: autoState, size }), className)}
      {...props}
    >
      <span className="flex items-center gap-2">
        {children}
        
        {/* Required indicator */}
        {showRequired && (
          <span className="text-red-500 text-xs" aria-label="required">
            *
          </span>
        )}
        
        {/* Optional indicator */}
        {showOptional && (
          <span className="text-gray-400 text-xs font-normal">
            (optional)
          </span>
        )}
        
        {/* Loading indicator */}
        {isPending && (
          <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        )}
      </span>
    </Label>
  )
}

// Enhanced form control with better state management
function FormControl({ className, ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId, isValid, isInvalid } = useFormField()

  return (
    <Slot
      data-slot="form-control"
      data-valid={isValid}
      data-invalid={isInvalid}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      className={cn(
        // Base styles for form controls
        "transition-all duration-200",
        // State-based styling
        isValid && "border-green-500/50 bg-green-50/50 dark:bg-green-950/50",
        isInvalid && "border-red-500/50 bg-red-50/50 dark:bg-red-950/50",
        className
      )}
      {...props}
    />
  )
}

// Enhanced form description with better typography
const formDescriptionVariants = cva(
  "text-xs leading-relaxed transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "text-gray-600 dark:text-gray-400",
        muted: "text-gray-500 dark:text-gray-500",
        emphasis: "text-gray-700 dark:text-gray-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface FormDescriptionProps 
  extends React.ComponentProps<"p">,
    VariantProps<typeof formDescriptionVariants> {}

function FormDescription({ 
  className, 
  variant,
  ...props 
}: FormDescriptionProps) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn(formDescriptionVariants({ variant }), className)}
      {...props}
    />
  )
}

// Enhanced form message with animations and better error handling
const formMessageVariants = cva(
  "text-xs font-medium leading-relaxed transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
  {
    variants: {
      variant: {
        error: "text-red-600 dark:text-red-400",
        success: "text-green-600 dark:text-green-400",
        warning: "text-amber-600 dark:text-amber-400",
        info: "text-blue-600 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  }
)

interface FormMessageProps 
  extends React.ComponentProps<"p">,
    VariantProps<typeof formMessageVariants> {
  icon?: boolean
}

function FormMessage({ 
  className, 
  variant = "error",
  icon = true,
  ...props 
}: FormMessageProps) {
  const { error, formMessageId, isValid } = useFormField()
  const body = error ? String(error?.message ?? "") : props.children

  // Auto-detect variant based on state
  const autoVariant = React.useMemo(() => {
    if (variant !== "error") return variant
    if (isValid) return "success"
    return "error"
  }, [variant, isValid])

  if (!body) {
    return null
  }

  const IconComponent = () => {
    switch (autoVariant) {
      case "error":
        return (
          <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case "success":
        return (
          <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case "warning":
        return (
          <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case "info":
        return (
          <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <p
      data-slot="form-message"
      data-variant={autoVariant}
      id={formMessageId}
      className={cn(
        formMessageVariants({ variant: autoVariant }),
        "animate-slide-down flex items-start gap-2",
        className
      )}
      role={autoVariant === "error" ? "alert" : "status"}
      {...props}
    >
      {icon && <IconComponent />}
      <span>{body}</span>
    </p>
  )
}

// Form container component for better layout and styling
interface FormContainerProps extends React.ComponentProps<"div"> {
  variant?: "default" | "card" | "inline"
  spacing?: "compact" | "default" | "spacious"
}

function FormContainer({ 
  className, 
  variant = "default",
  spacing = "default",
  ...props 
}: FormContainerProps) {
  const spacingClasses = {
    compact: "space-y-4",
    default: "space-y-6",
    spacious: "space-y-8",
  }

  const variantClasses = {
    default: "",
    card: "p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg",
    inline: "flex flex-wrap gap-4 items-end",
  }

  return (
    <div
      data-slot="form-container"
      className={cn(
        "w-full",
        spacingClasses[spacing],
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

// Form section for grouping related fields
interface FormSectionProps extends React.ComponentProps<"fieldset"> {
  title?: string
  description?: string
}

function FormSection({ 
  className, 
  title, 
  description, 
  children,
  ...props 
}: FormSectionProps) {
  return (
    <fieldset
      data-slot="form-section"
      className={cn("space-y-4", className)}
      {...props}
    >
      {title && (
        <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </legend>
      )}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </fieldset>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormContainer,
  FormSection,
}