# Task E: Location Detail API Endpoint (TDD)

**Phase**: 3
**Estimated Time**: 2.5 hours (TDD included)
**Dependencies**: Task C (TourAPI Service)
**Assigned Agent**: backend-api-specialist
**Parallel Group**: 3A
**EST**: 6.5h | **EFT**: 9h | **Slack**: 4.5h

## Objective

Create detail API endpoint with comprehensive location data and images using TDD.

---

## 🔴 RED (30min)

```typescript
// app/api/tour/detail/[id]/__tests__/route.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '../route';

describe('GET /api/tour/detail/[id]', () => {
  it('should fail: get location detail', async () => {
    const response = await GET(
      new Request('http://localhost/api/tour/detail/123456'),
      { params: { id: '123456' } }
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.contentId).toBe('123456');
  });

  it('should fail: return 404 for non-existent location', async () => {
    const response = await GET(
      new Request('http://localhost/api/tour/detail/999999'),
      { params: { id: '999999' } }
    );

    expect(response.status).toBe(404);
  });
});
```

---

## 🟢 GREEN (1.5h)

```typescript
// app/api/tour/detail/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tourApiService } from '@/lib/services/tour-api';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-utils';
import { TourApiNotFoundError } from '@/lib/services/errors';

export const revalidate = 600; // Cache for 10 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return errorResponse('Location ID is required', 400);
    }

    // Get detail and images in parallel
    const [detail, images] = await Promise.all([
      tourApiService.getDetail(id),
      tourApiService.getImages(id).catch(() => []), // Images optional
    ]);

    const result = {
      ...detail,
      images,
    };

    const response = successResponse(result);
    response.headers.set('Cache-Control', 'public, s-maxage=600');

    return response;
  } catch (error: any) {
    console.error(`Detail API error for ${params.id}:`, error);

    if (error instanceof TourApiNotFoundError) {
      return notFoundResponse('Location');
    }

    return errorResponse(error.message, 500);
  }
}
```

---

## 🔵 REFACTOR (30min)

```typescript
// Add related locations endpoint
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeRelated = searchParams.get('includeRelated') === 'true';

    const [detail, images] = await Promise.all([
      tourApiService.getDetail(id),
      tourApiService.getImages(id).catch(() => []),
    ]);

    let related = [];
    if (includeRelated && detail.cat3) {
      // Find similar locations by category
      related = await tourApiService
        .search({
          cat3: detail.cat3,
          numOfRows: 6,
        })
        .then((res) => res.items.filter((item) => item.contentId !== id).slice(0, 6))
        .catch(() => []);
    }

    return successResponse({
      ...detail,
      images,
      related,
    });
  } catch (error: any) {
    if (error instanceof TourApiNotFoundError) {
      return notFoundResponse('Location');
    }
    return errorResponse(error.message, 500);
  }
}
```

---

## Success Criteria

- [x] Detail endpoint with ID parameter
- [x] Images fetched in parallel
- [x] Related locations support
- [x] 404 handling
- [x] Caching headers
- [x] Tests passing ✅
