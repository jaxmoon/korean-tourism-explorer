import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { rateLimiter } from '@/app/api/middleware';
import { badRequestResponse, errorResponse, successResponse } from '@/lib/api-utils';
import { SearchParams, SearchParamsSchema } from '@/lib/models/search-params';
import { tourApiService } from '@/lib/services/tour-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 300;

const CACHE_CONTROL_HEADER = 'public, s-maxage=300';

class SearchParameterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchParameterError';
  }
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let parsedParams: Partial<SearchParams> | undefined;

  try {
    parsedParams = extractSearchParams(request);
    const validatedParams = SearchParamsSchema.parse(parsedParams);

    logSearchKeyword(validatedParams.keyword);

    const result = await tourApiService.search(validatedParams);
    const response = successResponse(result);
    response.headers.set('Cache-Control', CACHE_CONTROL_HEADER);
    response.headers.set('X-Total-Count', result.totalCount.toString());
    return response;
  } catch (error) {
    logSearchError(error, parsedParams);

    if (error instanceof SearchParameterError) {
      return badRequestResponse(error.message);
    }

    if (error instanceof ZodError) {
      return badRequestResponse(formatZodError(error));
    }

    const message =
      error instanceof Error ? error.message || 'Failed to search locations' : 'Failed to search locations';
    return errorResponse(message, 500);
  }
}

function extractSearchParams(request: NextRequest): Partial<SearchParams> {
  const { searchParams } = new URL(request.url);

  return {
    keyword: sanitizeString(searchParams.get('keyword')),
    contentTypeId: parseIntegerParam(searchParams.get('contentTypeId'), 'contentTypeId'),
    areaCode: parseIntegerParam(searchParams.get('areaCode'), 'areaCode'),
    sigunguCode: parseIntegerParam(searchParams.get('sigunguCode'), 'sigunguCode'),
    cat1: sanitizeString(searchParams.get('cat1')),
    cat2: sanitizeString(searchParams.get('cat2')),
    cat3: sanitizeString(searchParams.get('cat3')),
    pageNo: parseIntegerParam(searchParams.get('pageNo'), 'pageNo'),
    numOfRows: parseIntegerParam(searchParams.get('numOfRows'), 'numOfRows'),
    arrange: sanitizeArrange(searchParams.get('arrange')),
  };
}

function sanitizeString(value: string | null): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeArrange(value: string | null): SearchParams['arrange'] | undefined {
  const trimmed = sanitizeString(value);
  if (!trimmed) {
    return undefined;
  }

  return trimmed.toUpperCase() as SearchParams['arrange'];
}

function parseIntegerParam(value: string | null, field: string): number | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new SearchParameterError(`${field} must be a valid number`);
  }

  return parsed;
}

function logSearchKeyword(keyword?: string) {
  if (!keyword) {
    return;
  }

  console.info('[SearchAPI] keyword search', {
    keyword,
    timestamp: new Date().toISOString(),
  });
}

function logSearchError(error: unknown, params?: Partial<SearchParams>) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('[SearchAPI] request failed', {
    message,
    params,
    timestamp: new Date().toISOString(),
  });
}

function formatZodError(error: ZodError): string {
  return error.errors
    .map((issue) => {
      const path = issue.path.join('.') || 'params';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
