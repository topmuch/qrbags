/**
 * Simple in-memory rate limiter for API routes
 * For production, consider using Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store for rate limit entries
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Message to return when rate limit is exceeded
   */
  message?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  message?: string;
}

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (e.g., IP address or email)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
      message: config.message || 'Trop de requêtes. Veuillez réessayer plus tard.',
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  login: { maxRequests: 5, windowMs: 60000 }, // 5 attempts per minute
  forgotPassword: { maxRequests: 3, windowMs: 300000 }, // 3 attempts per 5 minutes
  resetPassword: { maxRequests: 3, windowMs: 300000 }, // 3 attempts per 5 minutes
  register: { maxRequests: 3, windowMs: 3600000 }, // 3 registrations per hour
  
  // API endpoints - moderate limits
  api: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  
  // Public scan endpoint - higher limits
  scan: { maxRequests: 30, windowMs: 60000 }, // 30 scans per minute
} as const;

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
  };
}
