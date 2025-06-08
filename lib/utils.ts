import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Enhanced types for better development experience
interface TechLogo {
  tech: string;
  url: string;
  verified: boolean;
  cached?: boolean;
  timestamp?: number;
}

interface CacheEntry {
  url: string;
  exists: boolean;
  timestamp: number;
  expiresAt: number;
}

interface UtilsConfig {
  iconCache: {
    enabled: boolean;
    ttl: number; // Time to live in milliseconds
    maxSize: number;
  };
  fallbacks: {
    techIcon: string;
    interviewCover: string;
  };
  performance: {
    enableLogging: boolean;
    concurrentRequests: number;
  };
}

// Configuration with Apple-inspired defaults
const CONFIG: UtilsConfig = {
  iconCache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 500
  },
  fallbacks: {
    techIcon: "/tech.svg",
    interviewCover: "/covers/default.png"
  },
  performance: {
    enableLogging: false, // Set to true for debugging
    concurrentRequests: 10
  }
};

// In-memory cache for icon existence checks
const iconCache = new Map<string, CacheEntry>();

// Performance monitoring utilities
const performanceTimer = () => {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
};

const log = (message: string, data?: any) => {
  if (CONFIG.performance.enableLogging) {
    console.log(`[Utils] ${message}`, data || '');
  }
};

/**
 * Enhanced className merger with Apple-inspired naming
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Apple-inspired conditional className utility
 * Provides a more semantic way to handle conditional classes
 */
export function cnIf(condition: boolean, trueClasses: string, falseClasses?: string) {
  return condition ? trueClasses : (falseClasses || '');
}

/**
 * Responsive className builder for Apple-like responsive design
 */
export function cnResponsive(base: string, sm?: string, md?: string, lg?: string, xl?: string) {
  return cn(
    base,
    sm && `sm:${sm}`,
    md && `md:${md}`,
    lg && `lg:${lg}`,
    xl && `xl:${xl}`
  );
}

// Enhanced tech icon base URL with CDN fallbacks
const TECH_ICON_SOURCES = [
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons",
  "https://raw.githubusercontent.com/devicons/devicon/master/icons",
  // Add more CDN sources for reliability
] as const;

/**
 * Enhanced tech name normalization with better mappings
 */
const normalizeTechName = (tech: string): string => {
  if (!tech || typeof tech !== 'string') {
    log('Invalid tech name provided', tech);
    return 'unknown';
  }

  const key = tech
    .toLowerCase()
    .trim()
    .replace(/\.js$/i, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, ''); // Remove special characters

  const normalized = mappings[key as keyof typeof mappings];
  
  if (!normalized) {
    log(`No mapping found for tech: ${tech} (normalized: ${key})`);
    return key || 'unknown';
  }

  return normalized;
};

/**
 * Enhanced icon existence check with caching and retries
 */
const checkIconExists = async (url: string, useCache = true): Promise<boolean> => {
  const timer = performanceTimer();
  
  try {
    // Check cache first
    if (useCache && iconCache.has(url)) {
      const cached = iconCache.get(url)!;
      if (Date.now() < cached.expiresAt) {
        log(`Icon cache hit for: ${url}`, { timeTaken: timer() });
        return cached.exists;
      } else {
        iconCache.delete(url); // Remove expired entry
      }
    }

    // Make the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(url, { 
      method: "HEAD",
      signal: controller.signal,
      cache: "force-cache" // Use browser cache when available
    });

    clearTimeout(timeoutId);
    const exists = response.ok;

    // Cache the result
    if (useCache) {
      // Cleanup cache if it's getting too large
      if (iconCache.size >= CONFIG.iconCache.maxSize) {
        const oldestKey = iconCache.keys().next().value;
        if (oldestKey) iconCache.delete(oldestKey);
      }

      iconCache.set(url, {
        url,
        exists,
        timestamp: Date.now(),
        expiresAt: Date.now() + CONFIG.iconCache.ttl
      });
    }

    log(`Icon check completed for: ${url}`, { exists, timeTaken: timer() });
    return exists;

  } catch (error: any) {
    log(`Icon check failed for: ${url}`, { error: error.message, timeTaken: timer() });
    
    // If it's a network error, cache as non-existent for a shorter time
    if (useCache && error.name !== 'AbortError') {
      iconCache.set(url, {
        url,
        exists: false,
        timestamp: Date.now(),
        expiresAt: Date.now() + (CONFIG.iconCache.ttl / 4) // Cache failures for 6 hours
      });
    }
    
    return false;
  }
};

/**
 * Batch icon existence checks with concurrency control
 */
const checkIconsExistBatch = async (urls: string[]): Promise<boolean[]> => {
  const timer = performanceTimer();
  const batchSize = CONFIG.performance.concurrentRequests;
  const results: boolean[] = new Array(urls.length);

  // Process URLs in batches to avoid overwhelming the server
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchPromises = batch.map((url, index) => 
      checkIconExists(url).then(exists => ({ index: i + index, exists }))
    );

    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results[result.value.index] = result.value.exists;
      } else {
        // Handle rejected promises by defaulting to false
        const index = batchResults.indexOf(result);
        if (index !== -1) results[i + index] = false;
      }
    });
  }

  log(`Batch icon check completed`, { 
    total: urls.length, 
    found: results.filter(Boolean).length,
    timeTaken: timer()
  });

  return results;
};

/**
 * Enhanced tech logos retrieval with fallbacks and caching
 */
export const getTechLogos = async (
  techArray: string[],
  options: {
    useCache?: boolean;
    includeFallbacks?: boolean;
    preferredSource?: number;
  } = {}
): Promise<TechLogo[]> => {
  const timer = performanceTimer();
  const { 
    useCache = true, 
    includeFallbacks = true, 
    preferredSource = 0 
  } = options;

  try {
    // Validate input
    if (!Array.isArray(techArray) || techArray.length === 0) {
      log('Invalid tech array provided', techArray);
      return [];
    }

    // Filter out invalid entries and deduplicate
    const validTechs = [...new Set(
      techArray
        .filter(tech => tech && typeof tech === 'string' && tech.trim().length > 0)
        .map(tech => tech.trim())
    )];

    if (validTechs.length === 0) {
      log('No valid tech entries found');
      return [];
    }

    // Generate logo URLs with fallback sources
    const logoURLs = validTechs.map((tech) => {
      const normalized = normalizeTechName(tech);
      const baseURL = TECH_ICON_SOURCES[preferredSource] || TECH_ICON_SOURCES[0];
      
      return {
        tech,
        normalized,
        primaryUrl: `${baseURL}/${normalized}/${normalized}-original.svg`,
        fallbackUrls: TECH_ICON_SOURCES
          .filter((_, index) => index !== preferredSource)
          .map(source => `${source}/${normalized}/${normalized}-original.svg`)
      };
    });

    // Check primary URLs in batch
    const primaryUrls = logoURLs.map(item => item.primaryUrl);
    const primaryResults = await checkIconsExistBatch(primaryUrls);

    // Process results and handle fallbacks
    const results: TechLogo[] = await Promise.all(
      logoURLs.map(async (item, index) => {
        let finalUrl = item.primaryUrl;
        let verified = primaryResults[index];
        let cached = iconCache.has(item.primaryUrl);

        // If primary URL failed and fallbacks are enabled, try fallback URLs
        if (!verified && includeFallbacks && item.fallbackUrls.length > 0) {
          for (const fallbackUrl of item.fallbackUrls) {
            const fallbackExists = await checkIconExists(fallbackUrl, useCache);
            if (fallbackExists) {
              finalUrl = fallbackUrl;
              verified = true;
              cached = iconCache.has(fallbackUrl);
              break;
            }
          }
        }

        // Use fallback icon if nothing worked
        if (!verified && includeFallbacks) {
          finalUrl = CONFIG.fallbacks.techIcon;
          verified = false; // Mark as not verified since it's a fallback
        }

        return {
          tech: item.tech,
          url: finalUrl,
          verified,
          cached,
          timestamp: Date.now()
        };
      })
    );

    log(`Tech logos retrieval completed`, {
      requested: techArray.length,
      processed: validTechs.length,
      verified: results.filter(r => r.verified).length,
      cached: results.filter(r => r.cached).length,
      timeTaken: timer()
    });

    return results;

  } catch (error: any) {
    log('Error in getTechLogos', { error: error.message, timeTaken: timer() });
    
    // Return fallback results on error
    return techArray.map(tech => ({
      tech,
      url: CONFIG.fallbacks.techIcon,
      verified: false,
      cached: false,
      timestamp: Date.now()
    }));
  }
};

/**
 * Enhanced interview cover selection with better randomization
 */
export const getRandomInterviewCover = (options: {
  seed?: string;
  excludeCover?: string;
  preferredCovers?: string[];
} = {}): string => {
  const { seed, excludeCover, preferredCovers } = options;

  try {
    if (!interviewCovers) {
      log('No interview covers available, using fallback');
      return CONFIG.fallbacks.interviewCover;
    }

    let availableCovers = [...interviewCovers];

    // Filter out excluded cover
    if (excludeCover) {
      availableCovers = availableCovers.filter(cover => cover !== excludeCover);
    }

    // Prefer certain covers if specified
    if (preferredCovers && preferredCovers.length > 0) {
      const preferred = availableCovers.filter(cover => 
        preferredCovers.some(pref => cover.includes(pref))
      );
      if (preferred.length > 0) {
        availableCovers = preferred;
      }
    }

    // Ensure we have covers to choose from
    if (availableCovers.length === 0) {
      availableCovers = [...interviewCovers];
    }

    // Generate index based on seed for consistent results when needed
    let randomIndex: number;
    if (seed) {
      // Simple hash function for seeded randomness
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      randomIndex = Math.abs(hash) % availableCovers.length;
    } else {
      randomIndex = Math.floor(Math.random() * availableCovers.length);
    }

    const selectedCover = availableCovers[randomIndex];
    const coverPath = `/covers${selectedCover}`;

    log('Interview cover selected', { 
      selected: selectedCover, 
      from: availableCovers.length,
      seeded: !!seed 
    });

    return coverPath;

  } catch (error: any) {
    log('Error selecting interview cover', { error: error.message });
    return CONFIG.fallbacks.interviewCover;
  }
};

/**
 * Utility to get deterministic cover based on interview data
 */
export const getInterviewCover = (interviewData: {
  id?: string;
  role?: string;
  type?: string;
  userId?: string;
}): string => {
  // Create a seed from interview data for consistent covers
  const seed = [
    interviewData.id,
    interviewData.role,
    interviewData.type,
    interviewData.userId
  ].filter(Boolean).join('-');

  return getRandomInterviewCover({ 
    seed,
    preferredCovers: getPreferredCoversForRole(interviewData.role)
  });
};

/**
 * Helper to get preferred covers based on role
 */
const getPreferredCoversForRole = (role?: string): string[] => {
  if (!role) return [];

  const roleLower = role.toLowerCase();
  
  // Map roles to preferred company covers
  const roleMapping: Record<string, string[]> = {
    'frontend': ['facebook', 'google', 'netflix'],
    'backend': ['amazon', 'microsoft', 'uber'],
    'fullstack': ['google', 'facebook', 'apple'],
    'mobile': ['apple', 'google', 'uber'],
    'devops': ['amazon', 'microsoft', 'google'],
    'data': ['google', 'facebook', 'netflix'],
    'ml': ['google', 'facebook', 'nvidia'],
    'design': ['apple', 'figma', 'adobe']
  };

  // Find matching role patterns
  for (const [pattern, covers] of Object.entries(roleMapping)) {
    if (roleLower.includes(pattern)) {
      return covers;
    }
  }

  return [];
};

/**
 * Utility to preload tech icons for better performance
 */
export const preloadTechIcons = async (techArrays: string[][]): Promise<void> => {
  const timer = performanceTimer();
  const allTechs = [...new Set(techArrays.flat())];
  
  log('Starting tech icons preload', { count: allTechs.length });
  
  // Preload in background without waiting
  getTechLogos(allTechs, { useCache: true }).then(() => {
    log('Tech icons preload completed', { 
      count: allTechs.length,
      timeTaken: timer()
    });
  });
};

/**
 * Cache management utilities
 */
export const cacheUtils = {
  /**
   * Clear icon cache
   */
  clearIconCache: (): void => {
    iconCache.clear();
    log('Icon cache cleared');
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => ({
    size: iconCache.size,
    maxSize: CONFIG.iconCache.maxSize,
    entries: Array.from(iconCache.entries()).map(([url, entry]) => ({
      url,
      exists: entry.exists,
      age: Date.now() - entry.timestamp,
      ttl: entry.expiresAt - Date.now()
    }))
  }),

  /**
   * Cleanup expired cache entries
   */
  cleanupCache: (): number => {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [url, entry] of iconCache.entries()) {
      if (now >= entry.expiresAt) {
        iconCache.delete(url);
        cleaned++;
      }
    }
    
    log('Cache cleanup completed', { entriesRemoved: cleaned });
    return cleaned;
  }
};

/**
 * Development utilities for debugging
 */
export const devUtils = {
  /**
   * Enable/disable performance logging
   */
  setLogging: (enabled: boolean): void => {
    CONFIG.performance.enableLogging = enabled;
  },

  /**
   * Get current configuration
   */
  getConfig: (): UtilsConfig => ({ ...CONFIG }),

  /**
   * Test tech name normalization
   */
  testNormalization: (tech: string) => ({
    input: tech,
    normalized: normalizeTechName(tech),
    hasMappinng: !!(mappings as any)[normalizeTechName(tech)]
  })
};