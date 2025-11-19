import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

const middlewareModulePath = '@/app/api/middleware';

describe('rateLimiter', () => {
  let rateLimiter: (request: Request) => Promise<Response | null> | Response | null;
  let resetRateLimiter: () => void;

  const createRequest = (ip: string) =>
    new Request('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': ip,
      },
    });

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const middlewareModule = await import(middlewareModulePath);
    rateLimiter = middlewareModule.rateLimiter;
    resetRateLimiter = middlewareModule.__resetRateLimiter;
    resetRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request within the window', async () => {
    const result = await rateLimiter(createRequest('1.1.1.1'));
    expect(result).toBeNull();
  });

  it('blocks requests exceeding 100 per minute', async () => {
    let response: Response | null = null;

    for (let i = 0; i < 101; i++) {
      response = await rateLimiter(createRequest('2.2.2.2'));
    }

    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
  });

  it('resets counts after the time window expires', async () => {
    for (let i = 0; i < 101; i++) {
      await rateLimiter(createRequest('3.3.3.3'));
    }

    expect(await rateLimiter(createRequest('3.3.3.3'))).not.toBeNull();

    vi.advanceTimersByTime(60_001);

    const afterReset = await rateLimiter(createRequest('3.3.3.3'));
    expect(afterReset).toBeNull();
  });

  it('tracks limits per IP using the x-forwarded-for header', async () => {
    for (let i = 0; i < 101; i++) {
      await rateLimiter(createRequest('4.4.4.4'));
    }

    const blocked = await rateLimiter(createRequest('4.4.4.4'));
    expect(blocked?.status).toBe(429);

    const otherIpAllowed = await rateLimiter(createRequest('5.5.5.5'));
    expect(otherIpAllowed).toBeNull();
  });
});

describe('errorHandler', () => {
  let errorHandler: (error: Error, status?: number) => {
    error: string;
    status: number;
    timestamp: string;
  };

  beforeEach(async () => {
    const middlewareModule = await import(middlewareModulePath);
    errorHandler = middlewareModule.errorHandler;
  });

  it('creates a structured error response object', () => {
    const result = errorHandler(new Error('Boom'));

    expect(result.error).toContain('Boom');
    expect(result.status).toBe(500);
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });

  it("includes 'error', 'status', and 'timestamp' fields", () => {
    const result = errorHandler(new Error('Missing data'), 400);

    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('status', 400);
    expect(result).toHaveProperty('timestamp');
  });

  it('logs the error to the console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(new Error('Log me'));
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('corsMiddleware', () => {
  let corsMiddleware: () => Headers;

  beforeEach(async () => {
    const middlewareModule = await import(middlewareModulePath);
    corsMiddleware = middlewareModule.corsMiddleware;
  });

  it('sets the required CORS headers', () => {
    const headers = corsMiddleware();

    expect(headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    expect(headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
  });

  it('explicitly allows GET, POST, and OPTIONS methods', () => {
    const headers = corsMiddleware();
    expect(headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
  });
});
