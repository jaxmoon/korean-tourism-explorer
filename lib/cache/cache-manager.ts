export interface CacheEntry<T> {
  data: T;
  expiresAt: number | null;
  lastAccessed: number;
}

export interface CacheManagerOptions {
  defaultTtlSeconds?: number;
  maxSize?: number;
  enableStatsLogging?: boolean;
  logger?: (message: string) => void;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

export interface CacheBatchEntry<T = unknown> {
  key: string;
  data: T;
  ttlSeconds?: number;
}

export interface WarmCacheTask<T = unknown> {
  key: string;
  fetcher: () => Promise<T>;
  ttlSeconds?: number;
}

export interface WarmCacheResult {
  successes: string[];
  failures: Record<string, unknown>;
}

const DEFAULT_OPTIONS: Required<Pick<CacheManagerOptions, 'enableStatsLogging'>> = {
  enableStatsLogging: false,
};

const DEFAULT_MAX_SIZE = Number.POSITIVE_INFINITY;

export class CacheManager {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly options: CacheManagerOptions;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: CacheManagerOptions = {}) {
    this.options = {
      defaultTtlSeconds: options.defaultTtlSeconds,
      maxSize: options.maxSize ?? DEFAULT_MAX_SIZE,
      enableStatsLogging: options.enableStatsLogging ?? DEFAULT_OPTIONS.enableStatsLogging,
      logger: options.logger ?? console.debug,
    };
  }

  public set<T>(key: string, data: T, ttlSeconds?: number): void {
    this.pruneExpiredEntries();
    const expiresAt = this.computeExpiry(ttlSeconds);

    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, {
      data,
      expiresAt,
      lastAccessed: Date.now(),
    });

    this.enforceSizeLimit();
  }

  public setMany(entries: CacheBatchEntry[]): void {
    entries.forEach((entry) => this.set(entry.key, entry.data, entry.ttlSeconds));
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    entry.lastAccessed = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data as T;
  }

  public getMany<T = unknown>(keys: string[]): Record<string, T | null> {
    return keys.reduce<Record<string, T | null>>((acc, key) => {
      acc[key] = this.get<T>(key);
      return acc;
    }, {});
  }

  public invalidate(pattern: string): void {
    if (!pattern.includes('*')) {
      this.cache.delete(pattern);
      return;
    }

    const matcher = this.createWildcardMatcher(pattern);
    for (const key of this.cache.keys()) {
      if (matcher(key)) {
        this.cache.delete(key);
      }
    }
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats(): CacheStats {
    this.pruneExpiredEntries();
    const total = this.hits + this.misses;
    const stats: CacheStats = {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: total > 0 ? this.hits / total : 0,
    };

    if (this.options.enableStatsLogging) {
      this.options.logger?.(
        `[CacheManager] size=${stats.size} hits=${stats.hits} misses=${stats.misses} evictions=${stats.evictions} hitRate=${stats.hitRate.toFixed(
          3,
        )}`,
      );
    }

    return stats;
  }

  public async warmCache(tasks: WarmCacheTask[]): Promise<WarmCacheResult> {
    const successes: string[] = [];
    const failures: Record<string, unknown> = {};

    for (const task of tasks) {
      try {
        const data = await task.fetcher();
        this.set(task.key, data, task.ttlSeconds);
        successes.push(task.key);
      } catch (error) {
        failures[task.key] = error;
      }
    }

    return { successes, failures };
  }

  private computeExpiry(ttlSeconds?: number): number | null {
    const ttl = ttlSeconds ?? this.options.defaultTtlSeconds;
    if (ttl === undefined || ttl === null) {
      return null;
    }

    if (ttl <= 0) {
      return Date.now();
    }

    return Date.now() + ttl * 1000;
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }

  private pruneExpiredEntries(): void {
    if (this.cache.size === 0) {
      return;
    }

    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  private enforceSizeLimit(): void {
    const { maxSize = DEFAULT_MAX_SIZE } = this.options;
    if (!Number.isFinite(maxSize)) {
      return;
    }

    while (this.cache.size > maxSize) {
      const lruKey = this.cache.keys().next().value as string | undefined;
      if (lruKey === undefined) {
        break;
      }
      this.cache.delete(lruKey);
      this.evictions++;
    }
  }

  private createWildcardMatcher(pattern: string): (candidate: string) => boolean {
    const escaped = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
    const regexPattern = `^${escaped.replace(/\*/g, '.*')}$`;
    const regex = new RegExp(regexPattern);
    return (candidate: string) => regex.test(candidate);
  }
}

export const cacheManager = new CacheManager();
