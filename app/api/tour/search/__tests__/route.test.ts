import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const searchMock = vi.fn();
const rateLimiterMock = vi.fn();

vi.mock('@/lib/services/tour-api', () => ({
  tourApiService: {
    search: searchMock,
  },
}));

vi.mock('@/app/api/middleware', () => ({
  rateLimiter: rateLimiterMock,
}));

type SearchRouteModule = typeof import('../route');
type SearchResult = {
  items: any[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
};

describe('GET /api/tour/search', () => {
  let GET: SearchRouteModule['GET'];

  const buildSearchResult = (overrides: Partial<SearchResult> = {}): SearchResult => ({
    items: [
      {
        contentId: '100',
        contentTypeId: 39,
        title: 'Sample Location',
        address: 'Seoul',
        areaCode: 1,
        sigunguCode: 1,
        cat1: 'A01',
        cat2: 'A0101',
        cat3: 'A01010100',
      },
    ],
    totalCount: 1,
    pageNo: 1,
    numOfRows: 20,
    ...overrides,
  });

  const createRequest = (query = '', headers: Record<string, string> = {}) => {
    const mergedHeaders = new Headers({
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    });

    return new NextRequest(`http://localhost/api/tour/search${query}`, {
      headers: mergedHeaders,
    });
  };

  beforeAll(async () => {
    ({ GET } = await import('../route'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimiterMock.mockResolvedValue(null);
    searchMock.mockResolvedValue(buildSearchResult());
  });

  it('returns search results when keyword filter is provided', async () => {
    const response = await GET(createRequest('?keyword=Seoul'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(Array.isArray(payload.data.items)).toBe(true);
    expect(payload.data).toMatchObject({
      pageNo: 1,
      numOfRows: 20,
      totalCount: 1,
    });
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'Seoul',
        pageNo: 1,
        numOfRows: 20,
      })
    );
  });

  it('applies content type filtering', async () => {
    searchMock.mockResolvedValueOnce(
      buildSearchResult({
        items: [
          {
            contentId: '301',
            contentTypeId: 39,
            title: 'Food Spot',
            address: 'Seoul',
            areaCode: 1,
            sigunguCode: 1,
          },
          {
            contentId: '302',
            contentTypeId: 39,
            title: 'Another Food Spot',
            address: 'Seoul',
            areaCode: 1,
            sigunguCode: 1,
          },
        ],
      })
    );

    const response = await GET(createRequest('?contentTypeId=39'));
    const payload = await response.json();

    expect(payload.data.items.every((item: any) => item.contentTypeId === 39)).toBe(true);
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contentTypeId: 39,
      })
    );
  });

  it('applies regional filters for areaCode and sigunguCode', async () => {
    searchMock.mockResolvedValueOnce(
      buildSearchResult({
        items: [
          {
            contentId: '401',
            contentTypeId: 12,
            title: 'Gyeongbokgung Palace',
            address: 'Jongno-gu',
            areaCode: 1,
            sigunguCode: 1,
          },
          {
            contentId: '402',
            contentTypeId: 12,
            title: 'Changdeokgung Palace',
            address: 'Jongno-gu',
            areaCode: 1,
            sigunguCode: 1,
          },
        ],
      })
    );

    const response = await GET(createRequest('?areaCode=1&sigunguCode=1'));
    const payload = await response.json();

    expect(payload.data.items.every((item: any) => item.areaCode === 1 && item.sigunguCode === 1)).toBe(
      true
    );
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        areaCode: 1,
        sigunguCode: 1,
      })
    );
  });

  it('applies category filters', async () => {
    const response = await GET(createRequest('?cat1=A01&cat2=A0101'));
    const payload = await response.json();

    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cat1: 'A01',
        cat2: 'A0101',
      })
    );
    expect(payload.success).toBe(true);
  });

  it('supports pagination parameters', async () => {
    searchMock.mockResolvedValueOnce(
      buildSearchResult({
        pageNo: 2,
        numOfRows: 10,
        items: Array.from({ length: 10 }, (_, idx) => ({
          contentId: `500-${idx}`,
          contentTypeId: 12,
          title: `Result ${idx}`,
          areaCode: 1,
          sigunguCode: 1,
        })),
      })
    );

    const response = await GET(createRequest('?pageNo=2&numOfRows=10'));
    const payload = await response.json();

    expect(payload.data.pageNo).toBe(2);
    expect(payload.data.numOfRows).toBe(10);
    expect(payload.data.items.length).toBeLessThanOrEqual(10);
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        pageNo: 2,
        numOfRows: 10,
      })
    );
  });

  it('accepts arrange parameter for sorting', async () => {
    const response = await GET(createRequest('?arrange=A'));
    await response.json();

    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        arrange: 'A',
      })
    );
  });

  it.each([
    ['negative page number', '?pageNo=-1', 'pageNo'],
    ['excessive numOfRows', '?numOfRows=1000', 'numOfRows'],
    ['non-numeric contentTypeId', '?contentTypeId=invalid', 'contentTypeId'],
  ])('returns 400 for %s', async (_, query, field) => {
    const response = await GET(createRequest(query));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain(field);
    expect(searchMock).not.toHaveBeenCalled();
  });

  it('applies combined filters together', async () => {
    searchMock.mockResolvedValueOnce(
      buildSearchResult({
        items: [
          {
            contentId: '601',
            contentTypeId: 39,
            title: 'Seoul Restaurant',
            address: 'Gangnam',
            areaCode: 1,
            sigunguCode: 1,
            cat1: 'A01',
            cat2: 'A0101',
          },
        ],
        totalCount: 42,
        numOfRows: 20,
        pageNo: 1,
      })
    );

    const response = await GET(
      createRequest('?keyword=%20Seoul%20&contentTypeId=39&areaCode=1&pageNo=1&numOfRows=20')
    );
    const payload = await response.json();

    expect(payload.success).toBe(true);
    expect(payload.data.totalCount).toBe(42);
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'Seoul',
        contentTypeId: 39,
        areaCode: 1,
        pageNo: 1,
        numOfRows: 20,
      })
    );
  });

  it('returns 429 when rate limiting is triggered on the 101st request', async () => {
    let requestCount = 0;
    rateLimiterMock.mockImplementation(() => {
      requestCount += 1;
      if (requestCount > 100) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429 })
        );
      }
      return Promise.resolve(null);
    });

    let response: Response | null = null;

    for (let i = 0; i < 101; i++) {
      response = await GET(createRequest('?keyword=Seoul', { 'x-forwarded-for': '9.9.9.9' }));
    }

    expect(response?.status).toBe(429);
    expect(searchMock).toHaveBeenCalledTimes(100);
  });
});
