import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheManager, CacheManagerOptions } from '../cache-manager';

const createTestCache = (options: Partial<CacheManagerOptions> = {}) =>
  new CacheManager({ enableStatsLogging: false, ...options });

const advanceTime = async (ms: number) => {
  vi.advanceTimersByTime(ms);
  // Allow any pending microtasks to flush
  await vi.runAllTimersAsync();
};

describe('CacheManager - Basic Cache Operations', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = createTestCache();
  });

  it('stores and retrieves data with set() and get()', () => {
    cache.set('user:1', { id: 1, name: 'Alice' });
    expect(cache.get<{ id: number; name: string }>('user:1')).toEqual({ id: 1, name: 'Alice' });
  });

  it('returns null for non-existent keys', () => {
    expect(cache.get('does-not-exist')).toBeNull();
  });

  it('retrieves cached data consistently across calls', () => {
    const payload = { id: 42 };
    cache.set('answer', payload);
    expect(cache.get('answer')).toEqual(payload);
    expect(cache.get('answer')).toEqual(payload);
  });

  it('caches different data types properly', () => {
    const sampleArray = [1, 2, 3];
    cache.set('string', 'value');
    cache.set('number', 99);
    cache.set('object', { nested: true });
    cache.set('array', sampleArray);

    expect(cache.get('string')).toBe('value');
    expect(cache.get('number')).toBe(99);
    expect(cache.get('object')).toEqual({ nested: true });
    expect(cache.get('array')).toEqual(sampleArray);
  });
});

describe('CacheManager - TTL and Expiration', () => {
  let cache: CacheManager;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    cache = createTestCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expires entries after TTL elapses', async () => {
    cache.set('temp', 'value', 0.1);

    await advanceTime(50);
    expect(cache.get('temp')).toBe('value');

    await advanceTime(60);
    expect(cache.get('temp')).toBeNull();
  });

  it('returns null for expired entries', async () => {
    cache.set('ephemeral', 'data', 0.1);
    await advanceTime(150);
    expect(cache.get('ephemeral')).toBeNull();
  });

  it('removes expired entries from the cache map', async () => {
    cache.set('short', 'life', 0.1);
    await advanceTime(200);
    cache.get('short');
    expect(cache.getStats().size).toBe(0);
  });

  it('reduces cache size after cleanup of expired entries', async () => {
    cache.set('short', 'life', 0.1);
    cache.set('long', 'lasting', 2);

    await advanceTime(200);
    cache.get('short');

    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(cache.get('long')).toBe('lasting');
  });
});

describe('CacheManager - Cache Invalidation', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = createTestCache();
    cache.set('tour:1', { id: 1 });
    cache.set('tour:2', { id: 2 });
    cache.set('user:1', { id: 'user-1' });
  });

  it('invalidate(pattern) clears matching wildcard keys', () => {
    cache.invalidate('tour:*');
    expect(cache.get('tour:1')).toBeNull();
    expect(cache.get('tour:2')).toBeNull();
    expect(cache.get('user:1')).toEqual({ id: 'user-1' });
  });

  it('invalidate(key) removes only the specified entry', () => {
    cache.invalidate('tour:1');
    expect(cache.get('tour:1')).toBeNull();
    expect(cache.get('tour:2')).toEqual({ id: 2 });
  });

  it('clear() removes every entry from the cache', () => {
    cache.clear();
    expect(cache.get('tour:1')).toBeNull();
    expect(cache.get('tour:2')).toBeNull();
    expect(cache.get('user:1')).toBeNull();
    expect(cache.getStats().size).toBe(0);
  });

  it('updates cache size after invalidation actions', () => {
    cache.invalidate('tour:*');
    expect(cache.getStats().size).toBe(1);
    cache.invalidate('user:1');
    expect(cache.getStats().size).toBe(0);
  });
});

describe('CacheManager - Metrics and Statistics', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = createTestCache();
  });

  it('tracks hit and miss counts via getStats()', () => {
    cache.set('hit', 'value');
    cache.get('hit');
    cache.get('miss');

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it('computes hitRate accurately (50% for 1 hit, 1 miss)', () => {
    cache.set('answer', 42);
    cache.get('answer');
    cache.get('unknown');

    const stats = cache.getStats();
    expect(stats.hitRate).toBeCloseTo(0.5, 5);
  });

  it('reports cache size correctly', () => {
    cache.set('a', 1);
    cache.set('b', 2);

    const stats = cache.getStats();
    expect(stats.size).toBe(2);
  });

  it('updates metrics across multiple get operations', () => {
    cache.set('persist', 'value');
    cache.get('persist');
    cache.get('persist');
    cache.get('missing');

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(2 / 3, 5);
  });
});

describe('CacheManager - Size Limits and LRU', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = createTestCache({ maxSize: 3 });
  });

  it('enforces the configured max size limit', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4);

    expect(cache.getStats().size).toBe(3);
  });

  it('evicts the least recently used item when cache is full', () => {
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.set('c', 'C');

    cache.get('a');
    cache.get('b');
    cache.set('d', 'D');

    expect(cache.get('c')).toBeNull();
    expect(cache.get('a')).toBe('A');
    expect(cache.get('b')).toBe('B');
  });

  it('evicts least recently used entries first in cascading scenarios', () => {
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.set('c', 'C');
    cache.get('a');

    cache.set('d', 'D');
    expect(cache.get('b')).toBeNull();

    cache.set('e', 'E');
    expect(cache.get('c')).toBeNull();
  });

  it('does not evict recently accessed items', () => {
    cache.set('a', 'A');
    cache.set('b', 'B');
    cache.set('c', 'C');

    cache.get('c');
    cache.get('b');

    cache.set('d', 'D');

    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe('B');
    expect(cache.get('c')).toBe('C');
  });
});

describe('CacheManager - Advanced Features', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = createTestCache({ maxSize: 5 });
  });

  it('setMany() and getMany() support bulk operations', () => {
    cache.setMany([
      { key: 'a', data: 1 },
      { key: 'b', data: 2 },
      { key: 'c', data: 3 },
    ]);

    const results = cache.getMany(['a', 'b', 'missing']);
    expect(results).toEqual({ a: 1, b: 2, missing: null });
  });

  it('warmCache() hydrates entries using fetchers', async () => {
    const response = await cache.warmCache([
      {
        key: 'tour:1',
        fetcher: async () => ({ id: 1 }),
      },
      {
        key: 'tour:2',
        fetcher: async () => ({ id: 2 }),
      },
    ]);

    expect(response.successes).toEqual(['tour:1', 'tour:2']);
    expect(response.failures).toEqual({});
    expect(cache.get('tour:1')).toEqual({ id: 1 });
    expect(cache.get('tour:2')).toEqual({ id: 2 });
  });

  it('warmCache() continues when a fetcher fails', async () => {
    const response = await cache.warmCache([
      {
        key: 'ok',
        fetcher: async () => 'fine',
      },
      {
        key: 'fail',
        fetcher: async () => {
          throw new Error('boom');
        },
      },
    ]);

    expect(response.successes).toEqual(['ok']);
    expect(Object.keys(response.failures)).toEqual(['fail']);
    expect(cache.get('ok')).toBe('fine');
    expect(cache.get('fail')).toBeNull();
  });
});
