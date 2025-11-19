import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TourApiNotFoundError } from '@/lib/services/errors';

// Mock must be hoisted before imports
vi.mock('@/lib/services/tour-api', () => ({
  tourApiService: {
    getDetail: vi.fn(),
    getImages: vi.fn(),
    search: vi.fn(),
  },
}));

import { GET, revalidate } from '../route';
import { tourApiService } from '@/lib/services/tour-api';

const mockTourApiService = tourApiService as any;

const baseDetail = {
  contentId: '12345',
  contentTypeId: 12,
  title: 'Sample Location',
  address: '123 Street',
  cat3: 'A01010100',
};

describe('GET /api/tour/detail/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and location data for a valid contentId', async () => {
    mockTourApiService.getDetail.mockResolvedValue(baseDetail);
    mockTourApiService.getImages.mockResolvedValue(['img-1.jpg']);

    const response = await GET(new Request('http://localhost/api/tour/detail/12345'), {
      params: { id: '12345' },
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.contentId).toBe('12345');
    expect(mockTourApiService.getDetail).toHaveBeenCalledWith('12345');
  });

  it('includes images array fetched from separate API call', async () => {
    mockTourApiService.getDetail.mockResolvedValue(baseDetail);
    mockTourApiService.getImages.mockResolvedValue(['img-1.jpg', 'img-2.jpg']);

    const response = await GET(new Request('http://localhost/api/tour/detail/12345'), {
      params: { id: '12345' },
    });
    const body = await response.json();

    expect(body.data.images).toEqual(['img-1.jpg', 'img-2.jpg']);
    expect(mockTourApiService.getImages).toHaveBeenCalledWith('12345');
  });

  it('returns 404 with proper message when location not found', async () => {
    mockTourApiService.getDetail.mockRejectedValue(
      new TourApiNotFoundError('Location not found')
    );

    const response = await GET(new Request('http://localhost/api/tour/detail/99999'), {
      params: { id: '99999' },
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Location not found');
    expect(mockTourApiService.getImages).not.toHaveBeenCalled();
  });

  it('sets revalidate and cache headers to 600 seconds', async () => {
    mockTourApiService.getDetail.mockResolvedValue(baseDetail);
    mockTourApiService.getImages.mockResolvedValue(['img-1.jpg']);

    const response = await GET(new Request('http://localhost/api/tour/detail/12345'), {
      params: { id: '12345' },
    });

    expect(response.headers.get('Cache-Control')).toBe('public, s-maxage=600');
    expect(revalidate).toBe(600);
  });

  it('returns 500 when Tour API fails unexpectedly', async () => {
    mockTourApiService.getDetail.mockRejectedValue(new Error('API failure'));

    const response = await GET(new Request('http://localhost/api/tour/detail/12345'), {
      params: { id: '12345' },
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('API failure');
  });

  it('includes related locations when includeRelated=true', async () => {
    mockTourApiService.getDetail.mockResolvedValue(baseDetail);
    mockTourApiService.getImages.mockResolvedValue([]);
    mockTourApiService.search.mockResolvedValue({
      items: [
        baseDetail,
        { ...baseDetail, contentId: '56789', title: 'Another Location' },
        { ...baseDetail, contentId: '99999', title: 'Third Location' },
      ],
      totalCount: 3,
      pageNo: 1,
      numOfRows: 3,
    });

    const response = await GET(
      new Request('http://localhost/api/tour/detail/12345?includeRelated=true'),
      { params: { id: '12345' } }
    );
    const body = await response.json();

    expect(mockTourApiService.search).toHaveBeenCalledWith({
      cat3: 'A01010100',
      pageNo: 1,
      numOfRows: 6,
    });
    expect(body.data.related).toHaveLength(2);
    expect(body.data.related.find((item: any) => item.contentId === '12345')).toBeUndefined();
  });

  it('falls back to empty images array when image request fails', async () => {
    mockTourApiService.getDetail.mockResolvedValue(baseDetail);
    mockTourApiService.getImages.mockRejectedValue(new Error('Images unavailable'));

    const response = await GET(new Request('http://localhost/api/tour/detail/12345'), {
      params: { id: '12345' },
    });
    const body = await response.json();

    expect(body.data.images).toEqual([]);
  });
});
