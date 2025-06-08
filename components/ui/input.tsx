import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm transition-all duration-200",
        "placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-100 dark:placeholder:text-gray-400",
        "dark:focus:border-blue-400 dark:focus:ring-blue-400/20 dark:disabled:bg-gray-800",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-gray-900 dark:file:text-gray-100",
        "selection:bg-blue-500/20",
        className
      )}
      {...props}
    />
  );
}

export { Input };