import { Controller, Control, FieldValues, Path, FieldPath } from "react-hook-form";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Enhanced interface with proper event handling
interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  disabled?: boolean;
  required?: boolean;
  optional?: boolean;
  variant?: "default" | "ghost" | "filled";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onBlur?: () => void; // Simplified onBlur without event parameter
  onFocus?: () => void; // Simplified onFocus without event parameter
  onChange?: (value: string) => void; // Simplified onChange with just the value
  onValidate?: (value: string) => boolean | string; // Custom validation
  showValidation?: boolean;
  className?: string;
  inputClassName?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

// Enhanced validation states
interface ValidationState {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  validationMessage?: string;
}

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  type = "text",
  disabled = false,
  required = false,
  optional = false,
  variant = "default",
  size = "md",
  icon,
  rightIcon,
  onBlur,
  onFocus,
  onChange,
  onValidate,
  showValidation = true,
  className,
  inputClassName,
  autoComplete,
  maxLength,
  minLength,
  pattern,
}: FormFieldProps<T>) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    isDirty: false,
    isTouched: false,
  });

  // Size configurations
  const sizeConfig = {
    sm: {
      input: "h-9 px-3 text-sm",
      icon: "w-4 h-4",
      iconContainer: "w-9",
    },
    md: {
      input: "h-11 px-4 text-sm",
      icon: "w-4 h-4", 
      iconContainer: "w-11",
    },
    lg: {
      input: "h-12 px-4 text-base",
      icon: "w-5 h-5",
      iconContainer: "w-12",
    },
  };

  // Variant configurations
  const variantConfig = {
    default: {
      base: "border border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80",
      focus: "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20",
      error: "border-red-500/50 bg-red-50/50 dark:border-red-400/50 dark:bg-red-950/50",
      success: "border-green-500/50 bg-green-50/50 dark:border-green-400/50 dark:bg-green-950/50",
    },
    ghost: {
      base: "border-0 bg-transparent",
      focus: "focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 dark:focus:bg-gray-800/50",
      error: "bg-red-50/30 dark:bg-red-950/30",
      success: "bg-green-50/30 dark:bg-green-950/30",
    },
    filled: {
      base: "border-0 bg-gray-100 dark:bg-gray-800",
      focus: "focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:focus:bg-gray-700",
      error: "bg-red-100 dark:bg-red-900/30",
      success: "bg-green-100 dark:bg-green-900/30",
    },
  };

  const config = sizeConfig[size];
  const variantStyle = variantConfig[variant];

  // Custom validation handler
  const handleCustomValidation = useCallback((value: string) => {
    if (!onValidate) return true;
    
    const result = onValidate(value);
    if (typeof result === "string") {
      setValidationState(prev => ({
        ...prev,
        isValid: false,
        validationMessage: result,
      }));
      return false;
    }
    
    setValidationState(prev => ({
      ...prev,
      isValid: result,
      validationMessage: result ? undefined : "Invalid input",
    }));
    return result;
  }, [onValidate]);

  // Enhanced blur handler
  const handleBlur = useCallback(() => {
    setValidationState(prev => ({ ...prev, isTouched: true }));
    onBlur?.(); // Call the simplified onBlur without event parameter
  }, [onBlur]);

  // Enhanced focus handler  
  const handleFocus = useCallback(() => {
    onFocus?.(); // Call the simplified onFocus without event parameter
  }, [onFocus]);

  // Enhanced change handler
  const handleChange = useCallback((value: string) => {
    setValidationState(prev => ({ ...prev, isDirty: true }));
    
    // Perform custom validation if provided
    if (onValidate) {
      handleCustomValidation(value);
    }
    
    onChange?.(value); // Call the simplified onChange with just the value
  }, [onChange, onValidate, handleCustomValidation]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const hasError = fieldState.error || (!validationState.isValid && validationState.isTouched);
        const isSuccess = !hasError && validationState.isDirty && validationState.isTouched;

        // Determine input state classes
        const stateClasses = hasError 
          ? variantStyle.error 
          : isSuccess 
            ? variantStyle.success 
            : "";

        return (
          <FormItem className={className}>
            {/* Enhanced Label */}
            <FormLabel className={cn(
              "text-sm font-medium leading-none transition-colors duration-200",
              hasError && "text-red-600 dark:text-red-400",
              isSuccess && "text-green-600 dark:text-green-400",
              !hasError && !isSuccess && "text-gray-900 dark:text-gray-100"
            )}>
              <span className="flex items-center gap-2">
                {label}
                {required && (
                  <span className="text-red-500 text-xs" aria-label="required">
                    *
                  </span>
                )}
                {optional && !required && (
                  <span className="text-gray-400 dark:text-gray-500 text-xs font-normal">
                    (optional)
                  </span>
                )}
              </span>
            </FormLabel>

            {/* Input Container */}
            <FormControl>
              <div className="relative">
                {/* Left Icon */}
                {icon && (
                  <div className={cn(
                    "absolute left-0 top-0 flex items-center justify-center pointer-events-none",
                    config.iconContainer,
                    config.input.split(' ')[0] // Get height class
                  )}>
                    <div className={cn(config.icon, "text-gray-400 dark:text-gray-500")}>
                      {icon}
                    </div>
                  </div>
                )}

                {/* Main Input */}
                <Input
                  type={type}
                  placeholder={placeholder}
                  disabled={disabled}
                  autoComplete={autoComplete}
                  maxLength={maxLength}
                  minLength={minLength}
                  pattern={pattern}
                  className={cn(
                    config.input,
                    variantStyle.base,
                    variantStyle.focus,
                    stateClasses,
                    icon && "pl-10",
                    rightIcon && "pr-10",
                    "transition-all duration-200 ease-in-out",
                    "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    disabled && "opacity-50 cursor-not-allowed",
                    inputClassName
                  )}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e); // React Hook Form onChange
                    handleChange(e.target.value); // Custom onChange
                  }}
                  onBlur={() => {
                    field.onBlur(); // React Hook Form onBlur
                    handleBlur(); // Custom onBlur without event parameter
                  }}
                  onFocus={handleFocus} // Custom onFocus without event parameter
                />

                {/* Right Icon */}
                {rightIcon && (
                  <div className={cn(
                    "absolute right-0 top-0 flex items-center justify-center pointer-events-none",
                    config.iconContainer,
                    config.input.split(' ')[0] // Get height class
                  )}>
                    <div className={cn(config.icon, "text-gray-400 dark:text-gray-500")}>
                      {rightIcon}
                    </div>
                  </div>
                )}

                {/* Validation Icons */}
                {showValidation && (hasError || isSuccess) && (
                  <div className={cn(
                    "absolute right-0 top-0 flex items-center justify-center pointer-events-none",
                    config.iconContainer,
                    config.input.split(' ')[0], // Get height class
                    rightIcon && "mr-10" // Offset if there's already a right icon
                  )}>
                    {hasError && (
                      <svg className={cn(config.icon, "text-red-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {isSuccess && (
                      <svg className={cn(config.icon, "text-green-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </FormControl>

            {/* Description */}
            {description && (
              <FormDescription className="text-xs text-gray-600 dark:text-gray-400">
                {description}
              </FormDescription>
            )}

            {/* Error Message */}
            <FormMessage className={cn(
              "text-xs font-medium leading-relaxed",
              hasError && "text-red-600 dark:text-red-400",
              isSuccess && "text-green-600 dark:text-green-400"
            )}>
              {fieldState.error?.message || validationState.validationMessage}
            </FormMessage>
          </FormItem>
        );
      }}
    />
  );
};

// Specialized form field components for common use cases
const EmailFormField = <T extends FieldValues>(props: Omit<FormFieldProps<T>, "type">) => (
  <FormField
    {...props}
    type="email"
    autoComplete="email"
    icon={
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
      </svg>
    }
  />
);

const PasswordFormField = <T extends FieldValues>({
  showPasswordToggle = true,
  ...props
}: Omit<FormFieldProps<T>, "type"> & { showPasswordToggle?: boolean }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      {...props}
      type={showPassword ? "text" : "password"}
      autoComplete="current-password"
      icon={
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
      rightIcon={
        showPasswordToggle ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 pointer-events-auto"
          >
            {showPassword ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        ) : undefined
      }
    />
  );
};

const SearchFormField = <T extends FieldValues>(props: Omit<FormFieldProps<T>, "type">) => (
  <FormField
    {...props}
    type="text"
    icon={
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    }
  />
);

export default FormField;
export { EmailFormField, PasswordFormField, SearchFormField };
export type { FormFieldProps, ValidationState };