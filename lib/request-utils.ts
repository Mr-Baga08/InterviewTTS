// ==========================================================================
// NEXT.JS REQUEST UTILITIES & ERROR HANDLING
// ==========================================================================

import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

/* ==========================================================================
   CLIENT IP EXTRACTION UTILITIES
   ========================================================================== */

/**
 * Extract client IP address from Next.js request
 * Handles various proxy configurations and hosting environments
 */
export function getClientIP(request?: NextRequest): string {
  // Note: NextRequest doesn't have an 'ip' property directly
  // We need to extract it from headers
  
  const possibleHeaders = [
    'x-forwarded-for',      // Standard proxy header
    'x-real-ip',            // Nginx proxy header
    'cf-connecting-ip',     // Cloudflare header
    'x-client-ip',          // Alternative header
    'x-forwarded',          // Less common
    'forwarded-for',        // Less common
    'forwarded',            // RFC 7239
  ];

  // Try to get headers (works in both middleware and route handlers)
  let headersList: Headers;
  
  if (request) {
    headersList = request.headers;
  } else {
    try {
      // This only works in route handlers, not middleware
      headersList = headers() as any;
    } catch {
      return 'unknown';
    }
  }

  // Check each possible header
  for (const header of possibleHeaders) {
    const value = headersList.get(header);
    if (value) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = value.split(',')[0]?.trim();
      if (ip && isValidIP(ip)) {
        return ip;
      }
    }
  }

  return 'unknown';
}

/**
 * Validate if a string is a valid IP address
 */
function isValidIP(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 validation (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  // Check for private/local IPs that shouldn't be used
  const privateIPs = ['127.0.0.1', '::1', 'localhost'];
  
  if (privateIPs.includes(ip)) {
    return false;
  }

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Get comprehensive client information
 */
export async function getClientInfo(request?: NextRequest) {
  let headersList: Headers;
  
  if (request) {
    headersList = request.headers;
  } else {
    try {
      headersList = await headers();
    } catch {
      return {
        ip: 'unknown',
        userAgent: 'unknown',
        country: null,
        city: null,
        isp: null,
      };
    }
  }

  return {
    ip: getClientIP(request),
    userAgent: headersList.get('user-agent') || 'unknown',
    country: headersList.get('cf-ipcountry') || null, // Cloudflare country
    city: headersList.get('cf-ipcity') || null, // Cloudflare city
    isp: headersList.get('cf-isp') || null, // Cloudflare ISP
    acceptLanguage: headersList.get('accept-language') || null,
    referer: headersList.get('referer') || null,
    origin: headersList.get('origin') || null,
  };
}

/* ==========================================================================
   ZOD ERROR HANDLING UTILITIES
   ========================================================================== */

/**
 * Enhanced Zod error formatter that handles all ZodIssue types safely
 */
export function formatZodError(error: z.ZodError) {
  return error.errors.map(issue => {
    const base = {
      field: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code,
    };

    // Safely add type-specific properties
    switch (issue.code) {
      case 'invalid_type':
        return {
          ...base,
          expected: (issue as z.ZodInvalidTypeIssue).expected,
          received: (issue as z.ZodInvalidTypeIssue).received,
        };
        
      case 'invalid_string':
        const stringIssue = issue as z.ZodInvalidStringIssue;
        return {
          ...base,
          validation: stringIssue.validation,
          ...(stringIssue.validation === 'regex' && { pattern: 'Invalid format' }),
        };
        
      case 'too_small':
        const tooSmallIssue = issue as z.ZodTooSmallIssue;
        return {
          ...base,
          minimum: tooSmallIssue.minimum,
          type: tooSmallIssue.type,
          inclusive: tooSmallIssue.inclusive,
        };
        
      case 'too_big':
        const tooBigIssue = issue as z.ZodTooBigIssue;
        return {
          ...base,
          maximum: tooBigIssue.maximum,
          type: tooBigIssue.type,
          inclusive: tooBigIssue.inclusive,
        };
        
      case 'invalid_enum_value':
        const enumIssue = issue as z.ZodInvalidEnumValueIssue;
        return {
          ...base,
          options: enumIssue.options,
          received: enumIssue.received,
        };
        
      case 'unrecognized_keys':
        const unrecognizedIssue = issue as z.ZodUnrecognizedKeysIssue;
        return {
          ...base,
          keys: unrecognizedIssue.keys,
        };
        
      case 'invalid_arguments':
      case 'invalid_return_type':
      case 'invalid_date':
      case 'invalid_literal':
      case 'custom':
      case 'invalid_intersection_types':
      case 'not_multiple_of':
      case 'not_finite':
      default:
        return base;
    }
  });
}

/**
 * Create user-friendly error messages from Zod validation errors
 */
export function createUserFriendlyZodError(error: z.ZodError): string[] {
  return error.errors.map(issue => {
    const fieldName = issue.path.length > 0 ? issue.path.join('.') : 'input';
    
    switch (issue.code) {
      case 'invalid_type':
        const typeIssue = issue as z.ZodInvalidTypeIssue;
        return `${fieldName}: Expected ${typeIssue.expected}, but received ${typeIssue.received}`;
        
      case 'too_small':
        const smallIssue = issue as z.ZodTooSmallIssue;
        if (smallIssue.type === 'string') {
          return `${fieldName}: Must be at least ${smallIssue.minimum} characters long`;
        } else if (smallIssue.type === 'number') {
          return `${fieldName}: Must be at least ${smallIssue.minimum}`;
        } else if (smallIssue.type === 'array') {
          return `${fieldName}: Must contain at least ${smallIssue.minimum} items`;
        }
        return `${fieldName}: ${issue.message}`;
        
      case 'too_big':
        const bigIssue = issue as z.ZodTooBigIssue;
        if (bigIssue.type === 'string') {
          return `${fieldName}: Must be no more than ${bigIssue.maximum} characters long`;
        } else if (bigIssue.type === 'number') {
          return `${fieldName}: Must be no more than ${bigIssue.maximum}`;
        } else if (bigIssue.type === 'array') {
          return `${fieldName}: Must contain no more than ${bigIssue.maximum} items`;
        }
        return `${fieldName}: ${issue.message}`;
        
      case 'invalid_string':
        const stringIssue = issue as z.ZodInvalidStringIssue;
        if (stringIssue.validation === 'email') {
          return `${fieldName}: Must be a valid email address`;
        } else if (stringIssue.validation === 'url') {
          return `${fieldName}: Must be a valid URL`;
        } else if (stringIssue.validation === 'regex') {
          return `${fieldName}: Invalid format`;
        }
        return `${fieldName}: ${issue.message}`;
        
      case 'invalid_enum_value':
        const enumIssue = issue as z.ZodInvalidEnumValueIssue;
        return `${fieldName}: Must be one of: ${enumIssue.options.join(', ')}`;
        
      case 'unrecognized_keys':
        const keyIssue = issue as z.ZodUnrecognizedKeysIssue;
        return `Unexpected fields: ${keyIssue.keys.join(', ')}`;
        
      default:
        return `${fieldName}: ${issue.message}`;
    }
  });
}

/* ==========================================================================
   REQUEST VALIDATION UTILITIES
   ========================================================================== */

/**
 * Safely parse JSON from Next.js request with better error handling
 */
export async function safeParseJSON(request: NextRequest): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const text = await request.text();
    
    if (!text.trim()) {
      return {
        success: false,
        error: 'Request body is empty'
      };
    }

    const data = JSON.parse(text);
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON format'
    };
  }
}

/**
 * Validate request with Zod schema and provide enhanced error information
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[]; details: any[] } {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: createUserFriendlyZodError(error),
        details: formatZodError(error)
      };
    }
    
    return {
      success: false,
      errors: ['Validation failed'],
      details: [{ message: 'Unknown validation error' }]
    };
  }
}

/* ==========================================================================
   CORS UTILITIES
   ========================================================================== */

/**
 * CORS headers for API routes
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 */
export function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/* ==========================================================================
   RATE LIMITING UTILITIES
   ========================================================================== */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
}

/**
 * Simple in-memory rate limiter for Next.js API routes
 * Note: Use Redis or similar in production for distributed systems
 */
export class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(request: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.config.keyGenerator ? 
      this.config.keyGenerator(request) : 
      getClientIP(request);
    
    const now = Date.now();
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    const resetTime = windowStart + this.config.windowMs;
    
    const current = this.store.get(key);
    
    if (!current || current.resetTime !== resetTime) {
      // New window or first request
      this.store.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime,
      };
    }
    
    if (current.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }
    
    current.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - current.count,
      resetTime,
    };
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}