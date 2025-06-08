"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white/95 group-[.toaster]:backdrop-blur-lg group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200/50 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl dark:group-[.toaster]:bg-gray-900/95 dark:group-[.toaster]:text-gray-100 dark:group-[.toaster]:border-gray-700/50",
          description: "group-[.toast]:text-gray-600 dark:group-[.toast]:text-gray-400",
          actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-900 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium dark:group-[.toast]:bg-gray-800 dark:group-[.toast]:text-gray-100",
          error: "group-[.toaster]:bg-red-50/95 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200/50 dark:group-[.toaster]:bg-red-950/95 dark:group-[.toaster]:text-red-100 dark:group-[.toaster]:border-red-800/50",
          success: "group-[.toaster]:bg-green-50/95 group-[.toaster]:text-green-900 group-[.toaster]:border-green-200/50 dark:group-[.toaster]:bg-green-950/95 dark:group-[.toaster]:text-green-100 dark:group-[.toaster]:border-green-800/50",
          warning: "group-[.toaster]:bg-yellow-50/95 group-[.toaster]:text-yellow-900 group-[.toaster]:border-yellow-200/50 dark:group-[.toaster]:bg-yellow-950/95 dark:group-[.toaster]:text-yellow-100 dark:group-[.toaster]:border-yellow-800/50",
          info: "group-[.toaster]:bg-blue-50/95 group-[.toaster]:text-blue-900 group-[.toaster]:border-blue-200/50 dark:group-[.toaster]:bg-blue-950/95 dark:group-[.toaster]:text-blue-100 dark:group-[.toaster]:border-blue-800/50",
        },
      }}
      position="top-right"
      expand={true}
      richColors={true}
      closeButton={true}
      duration={4000}
      {...props}
    />
  )
}

export { Toaster }