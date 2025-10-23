// Deno KV-based rate limiter for edge functions
// Implements 100 requests per minute per user

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 100;

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetAt: Date;
}

/**
 * Check if a user has exceeded their rate limit
 * @param userId - User ID to check
 * @param functionName - Name of the function being rate-limited
 * @returns RateLimitResult indicating if request is allowed
 */
export async function checkRateLimit(
  userId: string,
  functionName: string
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
        remainingRequests: MAX_REQUESTS_PER_WINDOW - 1,
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
        remainingRequests: MAX_REQUESTS_PER_WINDOW - 1,
        resetAt: new Date(now + RATE_LIMIT_WINDOW),
      };
    }

    // Check if limit exceeded
    if (count >= MAX_REQUESTS_PER_WINDOW) {
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
      remainingRequests: MAX_REQUESTS_PER_WINDOW - count - 1,
      resetAt: new Date(windowStart + RATE_LIMIT_WINDOW),
    };
  } catch (error) {
    console.error('[RATE_LIMIT] Error checking rate limit:', error);
    // Fail open - allow request if rate limiting system fails
    return {
      allowed: true,
      remainingRequests: MAX_REQUESTS_PER_WINDOW,
      resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW),
    };
  }
}

/**
 * Create rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(),
    'X-RateLimit-Remaining': result.remainingRequests.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };
}
