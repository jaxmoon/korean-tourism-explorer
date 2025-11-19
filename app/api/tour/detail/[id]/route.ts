import { NextRequest } from 'next/server';

import { tourApiService } from '@/lib/services/tour-api';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-utils';
import { TourApiNotFoundError } from '@/lib/services/errors';

// Route segment config - force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 600;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return errorResponse('Location ID is required', 400);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const includeRelated = searchParams.get('includeRelated') === 'true';

    // Fetch detail first (throws if not found)
    const detail = await tourApiService.getDetail(id);

    // Then fetch images (optional)
    const images = await tourApiService.getImages(id).catch(() => []);

    // Prepare response data
    const result: any = {
      ...detail,
      images,
    };

    // Optionally fetch related locations
    if (includeRelated && detail.cat3) {
      const relatedData = await tourApiService
        .search({
          cat3: detail.cat3,
          pageNo: 1,
          numOfRows: 6,
        })
        .catch(() => ({ items: [], totalCount: 0, pageNo: 1, numOfRows: 6 }));

      // Filter out current location and limit to 6
      result.related = relatedData.items
        .filter((item) => item.contentId !== id)
        .slice(0, 6);
    }

    // Create response with caching headers
    const response = successResponse(result);
    response.headers.set('Cache-Control', 'public, s-maxage=600');

    return response;
  } catch (error: any) {
    console.error(`Detail API error for ${params.id}:`, error);

    if (error instanceof TourApiNotFoundError) {
      return notFoundResponse('Location');
    }

    return errorResponse(error.message || 'Internal server error', 500);
  }
}
