import { NextRequest } from 'next/server';
import { ZodError, z } from 'zod';

import { rateLimiter } from '@/app/api/middleware';
import { badRequestResponse, errorResponse, successResponse } from '@/lib/api-utils';
import { tourApiService } from '@/lib/services/tour-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 60; // Cache for 1 minute (location-based data changes more frequently)

const CACHE_CONTROL_HEADER = 'public, s-maxage=60';

// Validation schema for location-based search parameters
const NearbyParamsSchema = z.object({
  mapX: z.number({ required_error: 'mapX (longitude) is required' }),
  mapY: z.number({ required_error: 'mapY (latitude) is required' }),
  radius: z
    .number()
    .int()
    .min(100, 'radius must be at least 100m')
    .max(20000, 'radius must not exceed 20000m (20km)')
    .default(5000),
  contentTypeId: z.number().int().positive().optional(),
  areaCode: z.number().int().positive().optional(),
  sigunguCode: z.number().int().positive().optional(),
  cat1: z.string().optional(),
  cat2: z.string().optional(),
  cat3: z.string().optional(),
  arrange: z.enum(['A', 'C', 'D', 'E', 'O', 'Q', 'R', 'S']).default('E'), // E = distance order
  pageNo: z.number().int().min(1).default(1),
  numOfRows: z.number().int().min(1).max(100).default(20),
});

type NearbyParams = z.infer<typeof NearbyParamsSchema>;

class NearbyParameterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NearbyParameterError';
  }
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let parsedParams: Partial<NearbyParams> | undefined;

  try {
    parsedParams = extractNearbyParams(request);
    const validatedParams = NearbyParamsSchema.parse(parsedParams);

    logNearbySearch(validatedParams);

    const result = await tourApiService.getNearbyLocations(validatedParams);
    const response = successResponse(result);
    response.headers.set('Cache-Control', CACHE_CONTROL_HEADER);
    response.headers.set('X-Total-Count', result.totalCount.toString());
    return response;
  } catch (error) {
    logNearbyError(error, parsedParams);

    if (error instanceof NearbyParameterError) {
      return badRequestResponse(error.message);
    }

    if (error instanceof ZodError) {
      return badRequestResponse(formatZodError(error));
    }

    const message =
      error instanceof Error ? error.message || 'Failed to search nearby locations' : 'Failed to search nearby locations';
    return errorResponse(message, 500);
  }
}

function extractNearbyParams(request: NextRequest): Partial<NearbyParams> {
  const { searchParams } = new URL(request.url);

  return {
    mapX: parseFloatParam(searchParams.get('mapX'), 'mapX'),
    mapY: parseFloatParam(searchParams.get('mapY'), 'mapY'),
    radius: parseIntegerParam(searchParams.get('radius'), 'radius'),
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

function sanitizeArrange(value: string | null): NearbyParams['arrange'] | undefined {
  const trimmed = sanitizeString(value);
  if (!trimmed) {
    return undefined;
  }

  return trimmed.toUpperCase() as NearbyParams['arrange'];
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
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new NearbyParameterError(`${field} must be a valid integer`);
  }

  return parsed;
}

function parseFloatParam(value: string | null, field: string): number | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    throw new NearbyParameterError(`${field} must be a valid number`);
  }

  return parsed;
}

function logNearbySearch(params: NearbyParams) {
  console.info('[NearbyAPI] location-based search', {
    coordinates: { mapX: params.mapX, mapY: params.mapY },
    radius: params.radius,
    timestamp: new Date().toISOString(),
  });
}

function logNearbyError(error: unknown, params?: Partial<NearbyParams>) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('[NearbyAPI] request failed', {
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
