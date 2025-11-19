# Task F: API Caching Layer (TDD)

**Phase**: 4 | **Time**: 2h | **Agent**: backend-specialist
**Dependencies**: Task D, E | **Critical Path**: No
**EST**: 11.5h | **Slack**: 8.5h

## Objective
Implement in-memory caching with TTL and cache invalidation.

---

## 🔴 RED (30min)

```typescript
// lib/cache/__tests__/cache-manager.test.ts
describe('CacheManager', () => {
  it('should cache and retrieve data', () => {
    const cache = new CacheManager();
    cache.set('key1', { data: 'test' }, 300);
    expect(cache.get('key1')).toEqual({ data: 'test' });
  });

  it('should expire after TTL', async () => {
    const cache = new CacheManager();
    cache.set('key1', 'data', 0.1); // 100ms
    await new Promise((r) => setTimeout(r, 200));
    expect(cache.get('key1')).toBeNull();
  });

  it('should track hit/miss rates', () => {
    const cache = new CacheManager();
    cache.set('key1', 'data', 300);
    cache.get('key1'); // hit
    cache.get('key2'); // miss

    const stats = cache.getStats();
    expect(stats.hitRate).toBe(50);
  });
});
```

---

## 🟢 GREEN (1h)

```typescript
// lib/cache/cache-manager.ts
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }
}

export const cacheManager = new CacheManager();
```

---

## 🔵 REFACTOR (30min)

```typescript
// Middleware for API routes
export function withCache(ttl: number) {
  return async (handler: Function) => {
    return async (req: NextRequest) => {
      const cacheKey = req.url;
      const cached = cacheManager.get(cacheKey);

      if (cached) {
        return NextResponse.json(cached, {
          headers: { 'X-Cache': 'HIT' },
        });
      }

      const response = await handler(req);
      const data = await response.json();

      cacheManager.set(cacheKey, data, ttl);

      return NextResponse.json(data, {
        headers: { 'X-Cache': 'MISS' },
      });
    };
  };
}
```

## Success Criteria
- [x] In-memory cache with TTL
- [x] Hit/miss tracking
- [x] Cache middleware
- [x] Tests passing ✅
