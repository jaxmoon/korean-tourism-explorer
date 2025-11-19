import { NextRequest, NextResponse } from 'next/server';

import { cacheManager } from './cache-manager';

interface CachedApiResponse<T = unknown> {
  body: T;
  status: number;
  headers: [string, string][];
}

const CACHE_HEADER = 'X-Cache';

const serializeHeaders = (headers: Headers): [string, string][] => [...headers.entries()];

const buildHeaders = (entries: [string, string][], cacheStatus: 'HIT' | 'MISS'): Headers => {
  const headers = new Headers(entries);
  headers.set(CACHE_HEADER, cacheStatus);
  return headers;
};

export const generateCacheKey = (request: NextRequest): string => {
  const method = request.method?.toUpperCase() ?? 'GET';
  const { pathname, searchParams } = request.nextUrl;
  const normalizedParams = [...searchParams.entries()].sort((a, b) => {
    if (a[0] === b[0]) {
      return a[1].localeCompare(b[1]);
    }
    return a[0].localeCompare(b[0]);
  });

  const normalizedSearch =
    normalizedParams.length > 0 ? `?${new URLSearchParams(normalizedParams).toString()}` : '';

  return `${method}:${pathname}${normalizedSearch}`;
};

type RouteHandler<T = unknown> = (request: NextRequest) => Promise<NextResponse<T>> | NextResponse<T>;

export const withCache =
  (ttlSeconds?: number) =>
  <T>(handler: RouteHandler<T>): RouteHandler<T> =>
    async (request: NextRequest) => {
      const cacheKey = generateCacheKey(request);
      const cachedResponse = cacheManager.get<CachedApiResponse<T>>(cacheKey);

      if (cachedResponse) {
        return NextResponse.json(cachedResponse.body, {
          status: cachedResponse.status,
          headers: buildHeaders(cachedResponse.headers, 'HIT'),
        });
      }

      const response = await handler(request);
      const contentType = response.headers.get('content-type') ?? '';

      if (!contentType.toLowerCase().includes('application/json')) {
        response.headers.set(CACHE_HEADER, 'BYPASS');
        return response;
      }

      let payload: T;
      try {
        payload = await response.clone().json();
      } catch {
        response.headers.set(CACHE_HEADER, 'BYPASS');
        return response;
      }

      const serializedHeaders = serializeHeaders(response.headers);
      cacheManager.set<CachedApiResponse<T>>(cacheKey, {
        body: payload,
        status: response.status,
        headers: serializedHeaders,
      }, ttlSeconds);

      return NextResponse.json(payload, {
        status: response.status,
        headers: buildHeaders(serializedHeaders, 'MISS'),
      });
    };
