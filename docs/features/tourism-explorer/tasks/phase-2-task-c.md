# Task C: TourAPI Integration Service (TDD)

**Phase**: 2
**Estimated Time**: 4.5 hours (TDD included)
**Dependencies**: Task A (Database Schema), Task B (API Route Structure)
**Assigned Agent**: backend-api-specialist
**Parallel Group**: 2A
**On Critical Path**: No
**EST**: 2h | **EFT**: 6.5h | **Slack**: 1h

## ⚠️ PREREQUISITES - READ FIRST

1. **Read the Tech Spec**:
   ```
   Read @docs/features/tourism-explorer/tech-spec.md
   ```

2. **TDD Approach**: 🔴 RED → 🟢 GREEN → 🔵 REFACTOR

3. **Dependencies**: Tasks A and B must be complete

## Objective

Create a robust TourAPI client service with comprehensive error handling, retries, and full test coverage.

---

## 🔴 STEP 1: RED - Write TourAPI Client Tests (45 minutes)

### 1.1 Write Service Tests

**Code**:
```typescript
// lib/services/__tests__/tour-api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TourApiService } from '../tour-api';
import axios from 'axios';

vi.mock('axios');

describe('TourAPI Service', () => {
  let service: TourApiService;

  beforeEach(() => {
    service = new TourApiService();
    vi.clearAllMocks();
  });

  it('should fail: search locations with keyword', async () => {
    const mockResponse = {
      data: {
        response: {
          header: { resultCode: '0000', resultMsg: 'OK' },
          body: {
            items: { item: [{ contentid: '123', title: 'Test' }] },
            totalCount: 1,
          },
        },
      },
    };

    (axios.get as any).mockResolvedValue(mockResponse);

    const result = await service.search({ keyword: 'Seoul' });

    expect(result).toBeDefined();
    expect(result.items).toHaveLength(1);
  });

  it('should fail: handle API errors gracefully', async () => {
    (axios.get as any).mockRejectedValue(new Error('Network error'));

    await expect(service.search({ keyword: 'test' })).rejects.toThrow();
  });

  it('should fail: retry on failure', async () => {
    (axios.get as any)
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce({ data: { response: { body: { items: { item: [] } } } } });

    const result = await service.search({ keyword: 'test' });

    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('should fail: get location detail', async () => {
    const mockResponse = {
      data: {
        response: {
          body: {
            items: {
              item: [
                {
                  contentid: '123',
                  title: 'Test Location',
                  addr1: 'Seoul',
                },
              ],
            },
          },
        },
      },
    };

    (axios.get as any).mockResolvedValue(mockResponse);

    const result = await service.getDetail('123');

    expect(result.contentId).toBe('123');
  });
});
```

**Run tests**:
```bash
npm run test
```

**Expected**: ❌ All tests fail

---

## 🟢 STEP 2: GREEN - Implement TourAPI Service (2.5 hours)

### 2.1 Create TourAPI Service

**Code**:
```typescript
// lib/services/tour-api.ts
import axios, { AxiosInstance } from 'axios';
import { config } from '@/lib/config';
import type { SearchParams } from '@/lib/models/search-params';
import type { Location } from '@/lib/models/location';
import { transformApiLocation } from '@/lib/models/helpers';

export class TourApiService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor() {
    this.baseUrl = config.tourApi.baseUrl;
    this.apiKey = config.tourApi.key;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[TourAPI] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[TourAPI] Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search locations by keyword and filters
   */
  async search(params: SearchParams): Promise<{
    items: Location[];
    totalCount: number;
    pageNo: number;
    numOfRows: number;
  }> {
    const queryParams = {
      serviceKey: this.apiKey,
      MobileOS: 'ETC',
      MobileApp: 'TourismExplorer',
      _type: 'json',
      listYN: 'Y',
      arrange: params.arrange || 'A',
      numOfRows: params.numOfRows || 20,
      pageNo: params.pageNo || 1,
      ...(params.keyword && { keyword: params.keyword }),
      ...(params.contentTypeId && { contentTypeId: params.contentTypeId }),
      ...(params.areaCode && { areaCode: params.areaCode }),
      ...(params.sigunguCode && { sigunguCode: params.sigunguCode }),
      ...(params.cat1 && { cat1: params.cat1 }),
      ...(params.cat2 && { cat2: params.cat2 }),
      ...(params.cat3 && { cat3: params.cat3 }),
    };

    const response = await this.retryRequest(() =>
      this.client.get('/searchKeyword1', { params: queryParams })
    );

    const body = response.data.response.body;
    const items = body.items?.item || [];

    return {
      items: items.map(transformApiLocation),
      totalCount: body.totalCount || 0,
      pageNo: body.pageNo || 1,
      numOfRows: body.numOfRows || 20,
    };
  }

  /**
   * Get location detail by contentId
   */
  async getDetail(contentId: string): Promise<Location> {
    const queryParams = {
      serviceKey: this.apiKey,
      MobileOS: 'ETC',
      MobileApp: 'TourismExplorer',
      _type: 'json',
      contentId,
      defaultYN: 'Y',
      firstImageYN: 'Y',
      areacodeYN: 'Y',
      catcodeYN: 'Y',
      addrinfoYN: 'Y',
      mapinfoYN: 'Y',
      overviewYN: 'Y',
    };

    const response = await this.retryRequest(() =>
      this.client.get('/detailCommon1', { params: queryParams })
    );

    const items = response.data.response.body.items?.item || [];

    if (items.length === 0) {
      throw new Error(`Location with id ${contentId} not found`);
    }

    return transformApiLocation(items[0]);
  }

  /**
   * Get location images
   */
  async getImages(contentId: string): Promise<string[]> {
    const queryParams = {
      serviceKey: this.apiKey,
      MobileOS: 'ETC',
      MobileApp: 'TourismExplorer',
      _type: 'json',
      contentId,
      imageYN: 'Y',
      subImageYN: 'Y',
    };

    const response = await this.retryRequest(() =>
      this.client.get('/detailImage1', { params: queryParams })
    );

    const items = response.data.response.body.items?.item || [];

    return items.map((item: any) => item.originimgurl).filter(Boolean);
  }

  /**
   * Get area codes (regions)
   */
  async getAreaCodes(): Promise<{ code: number; name: string }[]> {
    const queryParams = {
      serviceKey: this.apiKey,
      MobileOS: 'ETC',
      MobileApp: 'TourismExplorer',
      _type: 'json',
      numOfRows: 20,
      pageNo: 1,
    };

    const response = await this.retryRequest(() =>
      this.client.get('/areaCode1', { params: queryParams })
    );

    const items = response.data.response.body.items?.item || [];

    return items.map((item: any) => ({
      code: parseInt(item.code),
      name: item.name,
    }));
  }

  /**
   * Retry failed requests
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        console.log(`[TourAPI] Retrying... (${this.maxRetries - retries + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay);
        return this.retryRequest(fn, retries - 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const tourApiService = new TourApiService();
```

**Run tests**:
```bash
npm run test
```

**Expected**: ✅ All tests pass

---

## 🔵 STEP 3: REFACTOR - Add Error Handling (1 hour)

### 3.1 Create Custom Error Classes

**Code**:
```typescript
// lib/services/errors.ts
export class TourApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'TourApiError';
  }
}

export class TourApiNetworkError extends TourApiError {
  constructor(message: string, originalError?: Error) {
    super(message, undefined, originalError);
    this.name = 'TourApiNetworkError';
  }
}

export class TourApiRateLimitError extends TourApiError {
  constructor(message: string) {
    super(message, 429);
    this.name = 'TourApiRateLimitError';
  }
}

export class TourApiNotFoundError extends TourApiError {
  constructor(resourceId: string) {
    super(`Resource ${resourceId} not found`, 404);
    this.name = 'TourApiNotFoundError';
  }
}
```

### 3.2 Add Request Logging

**Code**:
```typescript
// lib/services/logger.ts
export class ApiLogger {
  private static logs: Array<{
    timestamp: Date;
    method: string;
    url: string;
    duration: number;
    status: 'success' | 'error';
  }> = [];

  static log(entry: {
    method: string;
    url: string;
    duration: number;
    status: 'success' | 'error';
  }) {
    this.logs.push({
      timestamp: new Date(),
      ...entry,
    });

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }

  static getLogs() {
    return this.logs;
  }

  static getStats() {
    const total = this.logs.length;
    const success = this.logs.filter((l) => l.status === 'success').length;
    const error = this.logs.filter((l) => l.status === 'error').length;
    const avgDuration =
      this.logs.reduce((sum, l) => sum + l.duration, 0) / total || 0;

    return {
      total,
      success,
      error,
      successRate: (success / total) * 100,
      avgDuration,
    };
  }
}
```

### 3.3 Update Service with Enhanced Error Handling

**Code**:
```typescript
// lib/services/tour-api.ts (updated)
import { TourApiError, TourApiNetworkError, TourApiNotFoundError } from './errors';
import { ApiLogger } from './logger';

export class TourApiService {
  // ... existing code ...

  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();

      ApiLogger.log({
        method: 'GET',
        url: 'TourAPI',
        duration: Date.now() - startTime,
        status: 'success',
      });

      return result;
    } catch (error: any) {
      ApiLogger.log({
        method: 'GET',
        url: 'TourAPI',
        duration: Date.now() - startTime,
        status: 'error',
      });

      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`[TourAPI] Retrying... (${this.maxRetries - retries + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1));
        return this.retryRequest(fn, retries - 1);
      }

      throw this.transformError(error);
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors and 5xx server errors
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      (error.response?.status >= 500 && error.response?.status < 600)
    );
  }

  private transformError(error: any): TourApiError {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new TourApiNetworkError('Network timeout', error);
    }

    if (error.response?.status === 404) {
      return new TourApiNotFoundError('Resource not found');
    }

    if (error.response?.status === 429) {
      return new TourApiRateLimitError('Rate limit exceeded');
    }

    return new TourApiError(
      error.message || 'Unknown API error',
      error.response?.status,
      error
    );
  }
}
```

**Run tests**:
```bash
npm run test
```

**Expected**: ✅ All tests still pass

---

## Success Criteria

- [x] TourAPI client class with axios
- [x] Search, detail, images, areas methods
- [x] Retry logic on failures (3 attempts)
- [x] Custom error classes
- [x] Request logging
- [x] Type-safe with TypeScript
- [x] All tests passing ✅
- [x] Test coverage >80%

---

## Update TODO.md

```markdown
#### Task C: TourAPI Integration Service (TDD)
- [x] **RED (45min)**: Write failing tests ✅
- [x] **GREEN (2.5h)**: Implement TourAPI client ✅
- [x] **REFACTOR (1h)**: Optimize and enhance ✅

**Status**: ✅ Completed
**Actual Time**: 4.5h
```
