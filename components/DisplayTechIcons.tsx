"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { cn, getTechLogos } from "@/lib/utils";

// Enhanced interface with additional props for better functionality
interface DisplayTechIconsProps {
  techStack: string[];
  maxIcons?: number;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "compact" | "detailed" | "minimal";
  showTooltip?: boolean;
  showCount?: boolean;
  animate?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
  className?: string;
  iconClassName?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  fallbackIcon?: string;
}

interface TechIcon {
  tech: string;
  url: string;
  verified: boolean;
  cached?: boolean;
}

const DisplayTechIcons = ({
  techStack,
  maxIcons = 5,
  size = "md",
  variant = "default",
  showTooltip = true,
  showCount = true,
  animate = true,
  onLoad,
  onError,
  className,
  iconClassName,
  loadingComponent,
  errorComponent,
  fallbackIcon = "/tech.svg",
}: DisplayTechIconsProps) => {
  const [techIcons, setTechIcons] = useState<TechIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  // Size configuration
  const sizeConfig = {
    sm: {
      container: "size-8",
      icon: "size-4",
      tooltip: "text-xs",
      overlap: "-ml-2",
      padding: "p-1.5",
    },
    md: {
      container: "size-10",
      icon: "size-5",
      tooltip: "text-sm",
      overlap: "-ml-3",
      padding: "p-2",
    },
    lg: {
      container: "size-12",
      icon: "size-6",
      tooltip: "text-sm",
      overlap: "-ml-3",
      padding: "p-2.5",
    },
    xl: {
      container: "size-16",
      icon: "size-8",
      tooltip: "text-base",
      overlap: "-ml-4",
      padding: "p-3",
    },
  };

  // Variant configuration
  const variantConfig = {
    default: {
      background: "bg-dark-300 dark:bg-gray-800",
      border: "border border-white/10",
      shadow: "shadow-md",
    },
    compact: {
      background: "bg-white/10 dark:bg-gray-900/50",
      border: "border border-white/5",
      shadow: "shadow-sm",
    },
    detailed: {
      background: "bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-800 dark:to-gray-900",
      border: "border border-white/20",
      shadow: "shadow-lg",
    },
    minimal: {
      background: "bg-transparent",
      border: "",
      shadow: "",
    },
  };

  const config = sizeConfig[size];
  const variantStyle = variantConfig[variant];

  // Load tech icons
  const loadTechIcons = useCallback(async () => {
    if (!techStack || techStack.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const icons = await getTechLogos(techStack, {
        useCache: true,
        includeFallbacks: true,
      });
      
      setTechIcons(icons);
      onLoad?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load tech icons";
      setError(errorMessage);
      onError?.(errorMessage);
      console.error("Error loading tech icons:", err);
    } finally {
      setIsLoading(false);
    }
  }, [techStack, onLoad, onError]);

  // Load icons on mount and when techStack changes
  useEffect(() => {
    loadTechIcons();
  }, [loadTechIcons]);

  // Handle individual image load
  const handleImageLoad = useCallback((tech: string) => {
    setLoadedImages(prev => new Set(prev).add(tech));
  }, []);

  // Handle individual image error
  const handleImageError = useCallback((tech: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    console.warn(`Failed to load icon for ${tech}`);
    const img = event.currentTarget;
    if (img.src !== fallbackIcon) {
      img.src = fallbackIcon;
    }
  }, [fallbackIcon]);

  // Get displayed icons (limited by maxIcons)
  const displayedIcons = techIcons.slice(0, maxIcons);
  const remainingCount = Math.max(0, techIcons.length - maxIcons);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex flex-row items-center", className)}>
        {loadingComponent || (
          <>
            {Array.from({ length: Math.min(3, maxIcons) }).map((_, index) => (
              <div
                key={`loading-${index}`}
                className={cn(
                  "relative rounded-full flex items-center justify-center",
                  config.container,
                  config.padding,
                  variantStyle.background,
                  variantStyle.border,
                  variantStyle.shadow,
                  index >= 1 && config.overlap,
                  animate && "animate-pulse"
                )}
              >
                <div className={cn("bg-gray-300 dark:bg-gray-600 rounded", config.icon)} />
              </div>
            ))}
          </>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("flex flex-row items-center", className)}>
        {errorComponent || (
          <div
            className={cn(
              "relative rounded-full flex items-center justify-center",
              config.container,
              config.padding,
              "bg-red-500/20 border border-red-500/30 text-red-400"
            )}
          >
            <svg className={cn(config.icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showTooltip && (
              <span className={cn("tech-tooltip", config.tooltip)}>
                Error loading icons
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (techIcons.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-row items-center", className)}>
      {displayedIcons.map(({ tech, url, verified }, index) => {
        const isLoaded = loadedImages.has(tech);
        
        return (
          <div
            key={tech}
            className={cn(
              "relative group rounded-full flex items-center justify-center transition-all duration-300",
              config.container,
              config.padding,
              variantStyle.background,
              variantStyle.border,
              variantStyle.shadow,
              index >= 1 && config.overlap,
              animate && "hover:scale-110 hover:z-10",
              animate && !isLoaded && "animate-pulse",
              !verified && "opacity-75"
            )}
          >
            {/* Tooltip */}
            {showTooltip && (
              <span 
                className={cn(
                  "tech-tooltip absolute -top-8 left-1/2 transform -translate-x-1/2",
                  "px-2 py-1 bg-black/80 text-white rounded opacity-0",
                  "group-hover:opacity-100 transition-opacity duration-200",
                  "pointer-events-none z-20 whitespace-nowrap",
                  config.tooltip
                )}
              >
                {tech}
                {!verified && (
                  <span className="ml-1 text-yellow-400">⚠</span>
                )}
              </span>
            )}

            {/* Tech Icon */}
            <Image
              src={url}
              alt={`${tech} icon`}
              width={32}
              height={32}
              className={cn(
                config.icon,
                "object-contain transition-opacity duration-300",
                !isLoaded && "opacity-0",
                iconClassName
              )}
              onLoad={() => handleImageLoad(tech)}
              onError={(e) => handleImageError(tech, e)}
              loading="lazy"
            />

            {/* Loading state for individual icons */}
            {!isLoaded && (
              <div className={cn(
                "absolute inset-0 flex items-center justify-center",
                "bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
              )}>
                <div className={cn("bg-gray-300 dark:bg-gray-600 rounded", "w-3 h-3")} />
              </div>
            )}

            {/* Verification indicator */}
            {verified && variant === "detailed" && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        );
      })}

      {/* Remaining count indicator */}
      {remainingCount > 0 && showCount && (
        <div
          className={cn(
            "relative rounded-full flex items-center justify-center font-medium",
            config.container,
            config.padding,
            variantStyle.background,
            variantStyle.border,
            variantStyle.shadow,
            config.overlap,
            "text-gray-600 dark:text-gray-300",
            config.tooltip
          )}
        >
          +{remainingCount}
          
          {/* Tooltip for remaining count */}
          {showTooltip && (
            <span className={cn(
              "tech-tooltip absolute -top-8 left-1/2 transform -translate-x-1/2",
              "px-2 py-1 bg-black/80 text-white rounded opacity-0",
              "group-hover:opacity-100 transition-opacity duration-200",
              "pointer-events-none z-20 whitespace-nowrap",
              config.tooltip
            )}>
              {techIcons.slice(maxIcons).map(icon => icon.tech).join(", ")}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DisplayTechIcons;