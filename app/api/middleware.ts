/**
 * API Middleware for Tourism Explorer
 * Provides rate limiting, error handling, and CORS configuration
 */

// Rate limiting state
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100; // requests per window
const WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Rate limiter middleware - limits requests to 100 per minute per IP
 * @param request - The incoming request
 * @returns null if request is allowed, Response with 429 if rate limit exceeded
 */
export async function rateLimiter(request: Request): Promise<Response | null> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = rateLimit.get(ip);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimit.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return null; // Allow request
  }

  if (record.count >= RATE_LIMIT) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Increment count
  record.count++;
  return null; // Allow request
}

/**
 * Error handler - formats errors consistently
 * @param error - The error object
 * @param status - Optional HTTP status code (default: 500)
 * @returns Structured error response object
 */
export function errorHandler(error: Error, status = 500) {
  console.error('API Error:', error);

  return {
    error: error.message || 'Internal Server Error',
    status,
    timestamp: new Date().toISOString(),
  };
}

/**
 * CORS middleware - returns headers with CORS configuration
 * @returns Headers object with CORS settings
 */
export function corsMiddleware() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return headers;
}

/**
 * Test helper to reset rate limiter state
 * NOTE: This is exported for testing purposes only
 */
export function __resetRateLimiter() {
  rateLimit.clear();
}
