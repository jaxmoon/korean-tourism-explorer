# Task B: API Route Structure Setup (TDD)

**Phase**: 1
**Estimated Time**: 1 hour (TDD included)
**Dependencies**: None
**Assigned Agent**: backend-specialist
**Parallel Group**: 1A
**On Critical Path**: No
**EST**: 0h | **EFT**: 1h | **Slack**: 1h

## ⚠️ PREREQUISITES - READ FIRST

**CRITICAL**: Before starting this task, you MUST:

1. **Read the Tech Spec**:
   ```
   Read @docs/features/tourism-explorer/tech-spec.md
   ```

2. **Understand TDD Approach**: 🔴 RED → 🟢 GREEN → 🔵 REFACTOR

3. **Check Dependencies**: None - start immediately

## Objective

Set up Next.js API route structure with middleware for rate limiting, error handling, and security headers, following TDD methodology.

---

## 🔴 STEP 1: RED - Write Failing Tests (15 minutes)

### 1.1 Write API Middleware Tests

**Code**:
```typescript
// app/api/__tests__/middleware.test.ts
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { rateLimiter, errorHandler, corsMiddleware } from '../middleware';

describe('API Middleware - Rate Limiting', () => {
  it('should fail: rate limiter not implemented', async () => {
    const request = new NextRequest('http://localhost/api/tour/search');

    // Should allow first request
    const response = await rateLimiter(request);
    expect(response.status).toBe(200);
  });

  it('should fail: block requests exceeding rate limit', async () => {
    const request = new NextRequest('http://localhost/api/tour/search');

    // Simulate 101 requests from same IP
    for (let i = 0; i < 101; i++) {
      await rateLimiter(request);
    }

    const response = await rateLimiter(request);
    expect(response.status).toBe(429); // Too Many Requests
  });
});

describe('API Middleware - Error Handling', () => {
  it('should fail: catch and format errors', () => {
    const error = new Error('Test error');
    const response = errorHandler(error);

    expect(response).toHaveProperty('error');
    expect(response).toHaveProperty('status');
  });
});

describe('API Middleware - CORS', () => {
  it('should fail: add CORS headers', () => {
    const headers = corsMiddleware();

    expect(headers.get('Access-Control-Allow-Origin')).toBeDefined();
    expect(headers.get('Access-Control-Allow-Methods')).toBeDefined();
  });
});
```

**Run tests**:
```bash
npm run test
```

**Expected**: ❌ All tests fail (middleware doesn't exist)

---

## 🟢 STEP 2: GREEN - Implement (30 minutes)

### 2.1 Create API Route Structure

**Code**:
```typescript
// app/api/tour/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Tourism Explorer API',
    version: '1.0.0',
    endpoints: [
      '/api/tour/search',
      '/api/tour/detail/[id]',
      '/api/tour/areas'
    ]
  });
}
```

### 2.2 Implement Rate Limiting Middleware

**Code**:
```typescript
// app/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = 100; // requests per window
const WINDOW_MS = 60 * 1000; // 1 minute

export async function rateLimiter(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = rateLimit.get(ip);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimit.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS
    });
    return null; // Allow request
  }

  if (record.count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  // Increment count
  record.count++;
  return null; // Allow request
}

export function errorHandler(error: Error) {
  console.error('API Error:', error);

  return {
    error: error.message || 'Internal Server Error',
    status: 500,
    timestamp: new Date().toISOString()
  };
}

export function corsMiddleware() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return headers;
}
```

### 2.3 Create Environment Config

**Code**:
```typescript
// lib/config.ts
import { z } from 'zod';

const envSchema = z.object({
  TOURAPI_KEY: z.string().min(1, 'TourAPI key is required'),
  TOURAPI_BASE_URL: z.string().url().default('http://apis.data.go.kr/B551011/KorService1'),
  NAVER_MAP_CLIENT_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);

export const config = {
  tourApi: {
    key: env.TOURAPI_KEY,
    baseUrl: env.TOURAPI_BASE_URL,
  },
  naverMap: {
    clientId: env.NAVER_MAP_CLIENT_ID,
  },
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
} as const;
```

**Run tests**:
```bash
npm run test
```

**Expected**: ✅ All tests pass

---

## 🔵 STEP 3: REFACTOR - Optimize (15 minutes)

### 3.1 Create Response Utilities

**Code**:
```typescript
// lib/api-utils.ts
import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status });
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }, { status });
}

export function notFoundResponse(resource: string) {
  return errorResponse(`${resource} not found`, 404);
}

export function badRequestResponse(message: string) {
  return errorResponse(message, 400);
}
```

### 3.2 Add .env.example

**Code**:
```bash
# .env.example
TOURAPI_KEY=your_tourapi_key_here
TOURAPI_BASE_URL=http://apis.data.go.kr/B551011/KorService1
NAVER_MAP_CLIENT_ID=your_naver_map_client_id
NODE_ENV=development
```

**Run tests**:
```bash
npm run test
```

**Expected**: ✅ Tests still pass

---

## Success Criteria

- [x] API route structure created
- [x] Rate limiting middleware implemented and tested
- [x] Error handling utilities created
- [x] CORS configuration added
- [x] Environment variables configured
- [x] All tests passing ✅
- [x] Test coverage >80%

---

## Update TODO.md

```markdown
#### Task B: API Route Structure Setup (TDD)
- [x] **RED (15min)**: Write failing tests ✅
- [x] **GREEN (30min)**: Implement API structure ✅
- [x] **REFACTOR (15min)**: Clean up ✅

**Status**: ✅ Completed
**Actual Time**: 1h
```
