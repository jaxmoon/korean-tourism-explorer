# Task A: Database Schema & Models (TDD) ⭐ CRITICAL

**Phase**: 1
**Estimated Time**: 2 hours (TDD included)
**Dependencies**: None
**Assigned Agent**: database-engineer-specialist
**Parallel Group**: 1A
**On Critical Path**: ⭐ Yes
**EST**: 0h | **EFT**: 2h | **Slack**: 0h

## ⚠️ PREREQUISITES - READ FIRST

**CRITICAL**: Before starting this task, you MUST:

1. **Read the Tech Spec**:
   ```
   Read @docs/features/tourism-explorer/tech-spec.md
   ```

2. **Understand TDD Approach**: This task follows Red-Green-Refactor cycle
   - 🔴 RED: Write failing tests first
   - 🟢 GREEN: Implement to pass tests
   - 🔵 REFACTOR: Optimize while keeping tests green

3. **Check Dependencies**: This task has NO dependencies - you can start immediately

## Objective

Create robust TypeScript data models and database schema for the Tourism Explorer application, with comprehensive test coverage to ensure type safety and data integrity.

## Agent Assignment

**Specialized Agent**: database-engineer-specialist

**Why this agent?**
- Expert in database schema design and optimization
- Understands TypeScript ORM patterns (Prisma/TypeORM)
- Can write comprehensive data validation tests
- Optimal for data modeling tasks

## Parallel Execution Context

**Parallel Group**: 1A
**Execution Level**: 0 (EST: 0h)
**On Critical Path**: Yes ⭐

**Can run in parallel with**:
- Task B: API Route Structure Setup (independent)

**Must wait for** (dependencies): None - can start immediately

**Blocks** (tasks waiting for this):
- Task C: TourAPI Integration Service (needs data models)
- Task G: Component Library (needs TypeScript interfaces)

**Earliest Start Time (EST)**: 0 hours from project start
**Latest Finish Time (LFT)**: 2 hours from project start
**Slack Time**: 0 hours (NO DELAY TOLERANCE - on critical path!)

---

## 🔴 STEP 1: RED - Write Failing Tests First (30 minutes)

### 1.1 Set up Testing Environment

**Action**: Initialize testing framework for data models

**Code**:
```typescript
// lib/models/__tests__/location.test.ts
import { describe, it, expect } from 'vitest';
import { LocationSchema, type Location } from '../location';
import { z } from 'zod';

describe('Location Data Model', () => {
  // Tests will be written here
});
```

**Setup**:
```bash
npm install -D vitest @types/node zod
npm install zod
```

**Validation**: Test file created, Vitest configured

### 1.2 Write Failing Tests for Location Model

**Action**: Write comprehensive tests for Location model

**Code**:
```typescript
// lib/models/__tests__/location.test.ts
import { describe, it, expect } from 'vitest';
import { LocationSchema, validateLocation, type Location } from '../location';

describe('Location Data Model - Schema Validation', () => {
  it('should fail: location schema not defined yet', () => {
    const validLocation = {
      contentId: '123456',
      contentTypeId: 12,
      title: 'Test Location',
      address: 'Seoul, Korea',
      mapX: 126.9780,
      mapY: 37.5665,
      thumbnailUrl: 'https://example.com/image.jpg',
      modifiedtime: '20231110120000'
    };

    // This SHOULD FAIL initially (RED phase)
    expect(() => LocationSchema.parse(validLocation)).not.toThrow();
  });

  it('should fail: invalid contentId (empty string)', () => {
    const invalidLocation = {
      contentId: '',  // Invalid
      contentTypeId: 12,
      title: 'Test',
      address: 'Address'
    };

    expect(() => LocationSchema.parse(invalidLocation)).toThrow();
  });

  it('should fail: invalid contentTypeId (not in enum)', () => {
    const invalidLocation = {
      contentId: '123',
      contentTypeId: 999,  // Invalid type
      title: 'Test'
    };

    expect(() => LocationSchema.parse(invalidLocation)).toThrow();
  });

  it('should fail: missing required fields', () => {
    const invalidLocation = {
      contentId: '123'
      // Missing contentTypeId, title, etc.
    };

    expect(() => LocationSchema.parse(invalidLocation)).toThrow();
  });

  it('should fail: invalid coordinate types', () => {
    const invalidLocation = {
      contentId: '123',
      contentTypeId: 12,
      title: 'Test',
      mapX: 'not-a-number',  // Should be number
      mapY: 'not-a-number'
    };

    expect(() => LocationSchema.parse(invalidLocation)).toThrow();
  });
});

describe('Location Model - Type Safety', () => {
  it('should fail: TypeScript interfaces not defined', () => {
    const location: Location = {
      contentId: '123',
      contentTypeId: 12,
      title: 'Test',
      address: 'Test Address',
      mapX: 126.97,
      mapY: 37.56
    };

    // TypeScript should allow this structure
    expect(location.contentId).toBe('123');
  });
});
```

**Write tests for additional models**:
```typescript
// lib/models/__tests__/search-params.test.ts
import { describe, it, expect } from 'vitest';
import { SearchParamsSchema, type SearchParams } from '../search-params';

describe('SearchParams Model', () => {
  it('should fail: validate keyword search params', () => {
    const params = {
      keyword: 'Seoul',
      contentTypeId: 12,
      areaCode: 1,
      pageNo: 1,
      numOfRows: 20
    };

    expect(() => SearchParamsSchema.parse(params)).not.toThrow();
  });

  it('should fail: reject invalid page numbers', () => {
    const invalidParams = {
      pageNo: -1,  // Invalid
      numOfRows: 20
    };

    expect(() => SearchParamsSchema.parse(invalidParams)).toThrow();
  });
});
```

**Run tests**:
```bash
npm run test
```

**Expected Result**: ❌ **ALL TESTS SHOULD FAIL** (models don't exist yet!)

**Validation**:
- Test files created ✅
- Tests run and fail appropriately ❌
- This proves tests are actually testing something!

---

## 🟢 STEP 2: GREEN - Implement to Pass Tests (1 hour)

### 2.1 Create Location Data Model

**Action**: Implement Location model with Zod schema

**Code**:
```typescript
// lib/models/location.ts
import { z } from 'zod';

/**
 * Content Type IDs from TourAPI
 * 12: 관광지(tourist spot)
 * 14: 문화시설(cultural facility)
 * 15: 행사/공연/축제(festival)
 * 25: 여행코스(travel course)
 * 28: 레포츠(leisure sports)
 * 32: 숙박(accommodation)
 * 38: 쇼핑(shopping)
 * 39: 음식점(restaurant)
 */
export const ContentTypeEnum = z.enum(['12', '14', '15', '25', '28', '32', '38', '39']);

/**
 * Zod schema for Location data validation
 */
export const LocationSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  contentTypeId: z.number().int().positive('Content Type ID must be positive'),
  title: z.string().min(1, 'Title is required'),
  address: z.string().optional(),
  addr1: z.string().optional(),
  addr2: z.string().optional(),
  zipcode: z.string().optional(),

  // Coordinates (Naver Maps uses Korean coordinate system)
  mapX: z.number().optional(),  // Longitude
  mapY: z.number().optional(),  // Latitude

  // Images
  thumbnailUrl: z.string().url().optional(),
  firstImage: z.string().url().optional(),
  firstImage2: z.string().url().optional(),

  // Region codes
  areaCode: z.number().int().optional(),
  sigunguCode: z.number().int().optional(),

  // Category
  cat1: z.string().optional(),  // 대분류
  cat2: z.string().optional(),  // 중분류
  cat3: z.string().optional(),  // 소분류

  // Additional info
  tel: z.string().optional(),
  homepage: z.string().optional(),
  overview: z.string().optional(),

  // Timestamps
  createdtime: z.string().optional(),
  modifiedtime: z.string().optional(),

  // Booking/rating (future)
  booktour: z.string().optional(),
  mlevel: z.string().optional(),
});

/**
 * TypeScript type inferred from schema
 */
export type Location = z.infer<typeof LocationSchema>;

/**
 * Validation helper function
 */
export function validateLocation(data: unknown): Location {
  return LocationSchema.parse(data);
}

/**
 * Safe validation (returns result with error)
 */
export function safeValidateLocation(data: unknown) {
  return LocationSchema.safeParse(data);
}
```

### 2.2 Create SearchParams Model

**Action**: Implement search parameters model

**Code**:
```typescript
// lib/models/search-params.ts
import { z } from 'zod';

/**
 * Search parameters for TourAPI search endpoint
 */
export const SearchParamsSchema = z.object({
  // Search query
  keyword: z.string().optional(),

  // Content type filter
  contentTypeId: z.number().int().positive().optional(),

  // Region filters
  areaCode: z.number().int().positive().optional(),
  sigunguCode: z.number().int().positive().optional(),

  // Category filters
  cat1: z.string().optional(),
  cat2: z.string().optional(),
  cat3: z.string().optional(),

  // Pagination
  pageNo: z.number().int().min(1, 'Page number must be at least 1').default(1),
  numOfRows: z.number().int().min(1).max(100, 'Max 100 rows per page').default(20),

  // Sorting
  arrange: z.enum(['A', 'B', 'C', 'D', 'E', 'O', 'P', 'Q', 'R']).optional(),
  // A: 제목순, B: 조회순, C: 수정일순, D: 생성일순, etc.

  // Location-based search
  mapX: z.number().optional(),
  mapY: z.number().optional(),
  radius: z.number().int().positive().optional(),  // in meters
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export function validateSearchParams(data: unknown): SearchParams {
  return SearchParamsSchema.parse(data);
}
```

### 2.3 Create API Response Models

**Action**: Model TourAPI response structure

**Code**:
```typescript
// lib/models/api-response.ts
import { z } from 'zod';
import { LocationSchema } from './location';

/**
 * TourAPI response header structure
 */
const ApiResponseHeaderSchema = z.object({
  resultCode: z.string(),
  resultMsg: z.string(),
});

/**
 * Paginated response body
 */
const ApiResponseBodySchema = z.object({
  items: z.object({
    item: z.array(LocationSchema),
  }),
  numOfRows: z.number(),
  pageNo: z.number(),
  totalCount: z.number(),
});

/**
 * Full API response wrapper
 */
export const TourApiResponseSchema = z.object({
  response: z.object({
    header: ApiResponseHeaderSchema,
    body: ApiResponseBodySchema,
  }),
});

export type TourApiResponse = z.infer<typeof TourApiResponseSchema>;
```

### 2.4 Create Database Schema (Prisma)

**Action**: Define Prisma schema for future database storage

**Code**:
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Location {
  id            String   @id @default(cuid())
  contentId     String   @unique
  contentTypeId Int
  title         String
  address       String?
  addr1         String?
  addr2         String?

  mapX          Float?
  mapY          Float?

  thumbnailUrl  String?
  firstImage    String?

  areaCode      Int?
  sigunguCode   Int?

  cat1          String?
  cat2          String?
  cat3          String?

  tel           String?
  overview      String?   @db.Text

  createdtime   String?
  modifiedtime  String?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([contentTypeId])
  @@index([areaCode])
  @@index([modifiedtime])
}
```

### 2.5 Run Tests

**Action**: Verify all tests now pass

**Code**:
```bash
npm run test
```

**Expected Result**: ✅ **ALL TESTS SHOULD PASS**

**Validation**:
- All schema tests pass ✅
- TypeScript types compile without errors ✅
- Zod validation works correctly ✅

---

## 🔵 STEP 3: REFACTOR - Optimize and Clean Up (30 minutes)

### 3.1 Add Helper Functions

**Action**: Create utility functions for common operations

**Code**:
```typescript
// lib/models/helpers.ts
import { Location } from './location';

/**
 * Transform TourAPI response to internal Location format
 */
export function transformApiLocation(apiData: any): Location {
  return {
    contentId: apiData.contentid,
    contentTypeId: parseInt(apiData.contenttypeid),
    title: apiData.title,
    address: apiData.addr1 || '',
    addr1: apiData.addr1,
    addr2: apiData.addr2,
    mapX: parseFloat(apiData.mapx) || undefined,
    mapY: parseFloat(apiData.mapy) || undefined,
    thumbnailUrl: apiData.firstimage || apiData.firstimage2,
    firstImage: apiData.firstimage,
    firstImage2: apiData.firstimage2,
    areaCode: parseInt(apiData.areacode) || undefined,
    sigunguCode: parseInt(apiData.sigungucode) || undefined,
    cat1: apiData.cat1,
    cat2: apiData.cat2,
    cat3: apiData.cat3,
    tel: apiData.tel,
    overview: apiData.overview,
    createdtime: apiData.createdtime,
    modifiedtime: apiData.modifiedtime,
  };
}

/**
 * Get content type label in Korean
 */
export function getContentTypeLabel(contentTypeId: number): string {
  const labels: Record<number, string> = {
    12: '관광지',
    14: '문화시설',
    15: '행사/축제',
    25: '여행코스',
    28: '레포츠',
    32: '숙박',
    38: '쇼핑',
    39: '음식점',
  };
  return labels[contentTypeId] || '기타';
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
```

### 3.2 Create Seed Data

**Action**: Generate development seed data

**Code**:
```typescript
// lib/models/seed-data.ts
import { Location } from './location';

export const seedLocations: Location[] = [
  {
    contentId: '264353',
    contentTypeId: 12,
    title: '경복궁',
    address: '서울특별시 종로구 사직로 161',
    addr1: '서울특별시 종로구 사직로 161',
    mapX: 126.977041,
    mapY: 37.578606,
    thumbnailUrl: 'https://example.com/gyeongbokgung.jpg',
    areaCode: 1,
    cat1: 'A01',
    cat2: 'A0101',
    cat3: 'A01010100',
    tel: '02-3700-3900',
    overview: '조선시대 대표 궁궐',
    modifiedtime: '20231110120000',
  },
  {
    contentId: '264555',
    contentTypeId: 39,
    title: '명동교자',
    address: '서울특별시 중구 명동10길 29',
    addr1: '서울특별시 중구 명동10길 29',
    mapX: 126.985302,
    mapY: 37.562405,
    areaCode: 1,
    cat1: 'A05',
    cat2: 'A0502',
    cat3: 'A05020100',
    tel: '02-776-5348',
    overview: '명동 대표 칼국수 맛집',
    modifiedtime: '20231110130000',
  },
];
```

### 3.3 Write Tests for Helper Functions

**Action**: Add tests for new utility functions

**Code**:
```typescript
// lib/models/__tests__/helpers.test.ts
import { describe, it, expect } from 'vitest';
import {
  transformApiLocation,
  getContentTypeLabel,
  calculateDistance
} from '../helpers';

describe('Helper Functions', () => {
  it('should transform API response to Location model', () => {
    const apiData = {
      contentid: '123',
      contenttypeid: '12',
      title: 'Test Location',
      addr1: 'Seoul',
      mapx: '126.97',
      mapy: '37.56',
    };

    const location = transformApiLocation(apiData);

    expect(location.contentId).toBe('123');
    expect(location.contentTypeId).toBe(12);
    expect(location.mapX).toBe(126.97);
  });

  it('should return correct content type labels', () => {
    expect(getContentTypeLabel(12)).toBe('관광지');
    expect(getContentTypeLabel(39)).toBe('음식점');
    expect(getContentTypeLabel(999)).toBe('기타');
  });

  it('should calculate distance between coordinates', () => {
    // Distance between Seoul and Busan (approx 325km)
    const distance = calculateDistance(37.5665, 126.9780, 35.1796, 129.0756);
    expect(distance).toBeGreaterThan(320);
    expect(distance).toBeLessThan(330);
  });
});
```

### 3.4 Run Final Tests

**Action**: Verify all tests still pass after refactoring

**Code**:
```bash
npm run test
```

**Expected Result**: ✅ **ALL TESTS STILL PASS**

**Validation**:
- Original tests pass ✅
- New helper tests pass ✅
- Code is clean and optimized ✅
- Test coverage >80% ✅

---

## Success Criteria

**All criteria must be met**:

- [x] **RED Phase Complete**: All tests written and initially failed ❌
- [x] **GREEN Phase Complete**: All tests now pass ✅
- [x] **REFACTOR Phase Complete**: Code optimized, tests still pass ✅
- [x] TypeScript interfaces defined for all data models
- [x] Zod schemas created with comprehensive validation
- [x] Prisma schema defined (if using database)
- [x] Helper functions created and tested
- [x] Seed data available for development
- [x] Test coverage >80%
- [x] No TypeScript errors
- [x] Documentation added (inline comments)

---

## Update TODO.md

**After completing this task**, update the TODO checklist:

```bash
# Update status in TODO.md
# Mark Task A as completed
```

```markdown
#### Task A: Database Schema & Models (TDD) ⭐ CRITICAL
- [x] **RED (30min)**: Write failing tests for data models ✅
- [x] **GREEN (1h)**: Implement to pass tests ✅
- [x] **REFACTOR (30min)**: Optimize and clean up ✅

**Status**: ✅ Completed
**Actual Time**: 2h
```

---

## Common Pitfalls

- ⚠️ **Writing code before tests**: Remember, TDD means tests FIRST!
- ⚠️ **Skipping the RED phase**: Always verify tests fail before implementation
- ⚠️ **Over-engineering in GREEN phase**: Write simplest code to pass tests
- ⚠️ **Breaking tests during REFACTOR**: Run tests continuously
- ⚠️ **Ignoring TypeScript errors**: Fix all type errors before moving on
- ⚠️ **Not validating API data**: Always use Zod schema for runtime validation

---

## Resources

- [TourAPI Documentation](https://www.data.go.kr/)
- [Zod Documentation](https://zod.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Notes

**This is a CRITICAL PATH task** ⭐
- Any delay here will delay the entire project
- Prioritize this task over non-critical tasks
- Ensure quality - other tasks depend on these models
- TDD approach ensures robustness from the start
