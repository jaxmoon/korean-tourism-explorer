# Task D: Search & Filter API Endpoints (TDD)

**Phase**: 3
**Estimated Time**: 3.5 hours (TDD included)
**Dependencies**: Task C (TourAPI Service)
**Assigned Agent**: backend-api-specialist
**Parallel Group**: 3A
**On Critical Path**: No
**EST**: 6.5h | **EFT**: 10h | **Slack**: 3.5h

## ⚠️ PREREQUISITES

1. Read @docs/features/tourism-explorer/tech-spec.md
2. TDD: 🔴 RED → 🟢 GREEN → 🔵 REFACTOR
3. Task C must be complete

## Objective

Create search API endpoint with keyword search, filters, pagination, and sorting using TDD.

---

## 🔴 RED - Write API Tests (45min)

```typescript
// app/api/tour/search/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('GET /api/tour/search', () => {
  it('should fail: search with keyword', async () => {
    const request = new NextRequest(
      'http://localhost/api/tour/search?keyword=Seoul'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.items).toBeInstanceOf(Array);
  });

  it('should fail: apply content type filter', async () => {
    const request = new NextRequest(
      'http://localhost/api/tour/search?contentTypeId=39'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.data.items.every((item: any) => item.contentTypeId === 39)).toBe(true);
  });

  it('should fail: paginate results', async () => {
    const request = new NextRequest(
      'http://localhost/api/tour/search?pageNo=2&numOfRows=10'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.data.pageNo).toBe(2);
    expect(data.data.numOfRows).toBe(10);
  });

  it('should fail: handle invalid parameters', async () => {
    const request = new NextRequest(
      'http://localhost/api/tour/search?pageNo=-1'
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
```

**Run**: `npm run test` → ❌ Fail

---

## 🟢 GREEN - Implement API (2h)

```typescript
// app/api/tour/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tourApiService } from '@/lib/services/tour-api';
import { SearchParamsSchema } from '@/lib/models/search-params';
import { successResponse, errorResponse, badRequestResponse } from '@/lib/api-utils';
import { rateLimiter } from '@/app/api/middleware';

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimiter(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate parameters
    const params = {
      keyword: searchParams.get('keyword') || undefined,
      contentTypeId: searchParams.get('contentTypeId')
        ? parseInt(searchParams.get('contentTypeId')!)
        : undefined,
      areaCode: searchParams.get('areaCode')
        ? parseInt(searchParams.get('areaCode')!)
        : undefined,
      sigunguCode: searchParams.get('sigunguCode')
        ? parseInt(searchParams.get('sigunguCode')!)
        : undefined,
      cat1: searchParams.get('cat1') || undefined,
      cat2: searchParams.get('cat2') || undefined,
      cat3: searchParams.get('cat3') || undefined,
      pageNo: searchParams.get('pageNo')
        ? parseInt(searchParams.get('pageNo')!)
        : 1,
      numOfRows: searchParams.get('numOfRows')
        ? parseInt(searchParams.get('numOfRows')!)
        : 20,
      arrange: searchParams.get('arrange') as any,
    };

    // Validate with Zod
    const validatedParams = SearchParamsSchema.parse(params);

    // Call TourAPI service
    const result = await tourApiService.search(validatedParams);

    return successResponse(result);
  } catch (error: any) {
    console.error('Search API error:', error);

    if (error.name === 'ZodError') {
      return badRequestResponse('Invalid parameters: ' + error.message);
    }

    return errorResponse(error.message || 'Failed to search locations', 500);
  }
}
```

**Run**: `npm run test` → ✅ Pass

---

## 🔵 REFACTOR - Add Query Optimization (45min)

```typescript
// app/api/tour/search/route.ts (optimized)
import { z } from 'zod';

// Add request caching
export const revalidate = 300; // Cache for 5 minutes

export async function GET(request: NextRequest) {
  // ... existing code ...

  try {
    const validatedParams = SearchParamsSchema.parse(params);

    // Add search analytics
    trackSearchQuery(validatedParams.keyword);

    const result = await tourApiService.search(validatedParams);

    // Add response headers
    const response = successResponse(result);
    response.headers.set('Cache-Control', 'public, s-maxage=300');
    response.headers.set('X-Total-Count', result.totalCount.toString());

    return response;
  } catch (error: any) {
    // Enhanced error logging
    console.error('[Search API]', {
      error: error.message,
      params,
      timestamp: new Date().toISOString(),
    });

    if (error.name === 'ZodError') {
      return badRequestResponse(formatZodError(error));
    }

    return errorResponse(error.message, 500);
  }
}

function formatZodError(error: z.ZodError): string {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
}

function trackSearchQuery(keyword?: string) {
  if (keyword && process.env.NODE_ENV === 'production') {
    // Track popular searches for analytics
    console.log('[Analytics] Search:', keyword);
  }
}
```

**Run**: `npm run test` → ✅ Pass

---

## Success Criteria

- [x] Search endpoint with filters
- [x] Pagination support
- [x] Sorting options
- [x] Parameter validation (Zod)
- [x] Error handling
- [x] Rate limiting
- [x] Tests passing ✅
- [x] Coverage >80%
