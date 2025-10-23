// Deno KV-based rate limiter for edge functions
// Configurable rate limits per function type

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Default limits by function category
export const RATE_LIMITS = {
  AI_FUNCTION: 100,        // AI functions: 100 req/min
  ML_TRAINING: 10,         // Expensive ML operations: 10 req/min
  TOURNAMENT: 1000,        // Rapid-fire tournament: 1000 req/min
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetAt: Date;
}

/**
 * Check if a user has exceeded their rate limit
 * @param userId - User ID to check
 * @param functionName - Name of the function being rate-limited
 * @param maxRequests - Maximum requests per window (defaults to 100)
 * @returns RateLimitResult indicating if request is allowed
 */
export async function checkRateLimit(
  userId: string,
  functionName: string,
  maxRequests: number = RATE_LIMITS.AI_FUNCTION
): Promise<RateLimitResult> {
  try {
    const kv = await Deno.openKv();
    const key = ["rate_limit", functionName, userId];
    const now = Date.now();

    // Get current rate limit data
    const result = await kv.get<{ count: number; windowStart: number }>(key);
    
    if (!result.value) {
      // First request in window
      await kv.set(key, { count: 1, windowStart: now }, {
        expireIn: RATE_LIMIT_WINDOW,
      });
      
      return {
        allowed: true,
        remainingRequests: maxRequests - 1,
        resetAt: new Date(now + RATE_LIMIT_WINDOW),
      };
    }

    const { count, windowStart } = result.value;
    const windowAge = now - windowStart;

    // Check if window has expired
    if (windowAge >= RATE_LIMIT_WINDOW) {
      // Reset window
      await kv.set(key, { count: 1, windowStart: now }, {
        expireIn: RATE_LIMIT_WINDOW,
      });
      
      return {
        allowed: true,
        remainingRequests: maxRequests - 1,
        resetAt: new Date(now + RATE_LIMIT_WINDOW),
      };
    }

    // Check if limit exceeded
    if (count >= maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetAt: new Date(windowStart + RATE_LIMIT_WINDOW),
      };
    }

    // Increment counter
    await kv.set(key, { count: count + 1, windowStart }, {
      expireIn: RATE_LIMIT_WINDOW - windowAge,
    });

    return {
      allowed: true,
      remainingRequests: maxRequests - count - 1,
      resetAt: new Date(windowStart + RATE_LIMIT_WINDOW),
    };
  } catch (error) {
    console.error('[RATE_LIMIT] Error checking rate limit:', error);
    // Fail open - allow request if rate limiting system fails
    return {
      allowed: true,
      remainingRequests: maxRequests,
      resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW),
    };
  }
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult, maxRequests: number): Record<string, string> {
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': result.remainingRequests.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };
}
