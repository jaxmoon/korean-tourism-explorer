import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TourApiNetworkError, TourApiNotFoundError, TourApiRateLimitError } from '@/lib/services/errors';
import { TourApiService } from '@/lib/services/tour-api';

// Mock axios before imports
vi.mock('axios', () => {
  const mockClient = {
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockClient),
      isAxiosError: (error: any) => Boolean(error?.isAxiosError),
      AxiosError: class extends Error {
        response?: any;
        code?: string;
        config?: any;
        isAxiosError = true;
        constructor(message: string, response?: any, code?: string, config?: any) {
          super(message);
          this.response = response;
          this.code = code;
          this.config = config;
        }
      },
    },
  };
});

import axios from 'axios';

const mockClient = (axios.create as any)();

const createApiResponse = (body: Record<string, any>) => ({
  data: {
    response: {
      header: {},
      body,
    },
  },
});

const createAxiosError = (overrides: Record<string, any> = {}) => ({
  message: overrides.message || 'error',
  isAxiosError: true,
  code: overrides.code,
  response: overrides.response,
});

describe('TourApiService', () => {
  let service: TourApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TourApiService();
  });

  it('searches locations by keyword and returns transformed payload', async () => {
    const apiLocation = {
      contentid: '123',
      contenttypeid: '12',
      title: 'Temple',
      addr1: 'Seoul',
      mapx: '128.1',
      mapy: '37.5',
    };

    mockClient.get.mockResolvedValue(
      createApiResponse({
        items: { item: [apiLocation] },
        totalCount: 1,
        pageNo: 2,
        numOfRows: 10,
      })
    );

    const result = await service.search({ keyword: 'temple', pageNo: 2, numOfRows: 10 });

    expect(mockClient.get).toHaveBeenCalledWith('/searchKeyword1', {
      params: expect.objectContaining({
        keyword: 'temple',
        pageNo: 2,
        numOfRows: 10,
        MobileOS: 'ETC',
        MobileApp: 'TourismExplorer',
        listYN: 'Y',
        serviceKey: expect.any(String),
      }),
    });

    expect(result.totalCount).toBe(1);
    expect(result.pageNo).toBe(2);
    expect(result.numOfRows).toBe(10);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].contentId).toBe('123');
  });

  it('fetches detail information for a content id', async () => {
    const apiLocation = {
      contentid: '555',
      contenttypeid: '15',
      title: 'Festival',
    };

    mockClient.get.mockResolvedValue(
      createApiResponse({
        items: { item: [apiLocation] },
      })
    );

    const result = await service.getDetail('555');

    expect(mockClient.get).toHaveBeenCalledWith('/detailCommon1', {
      params: expect.objectContaining({
        contentId: '555',
        overviewYN: 'Y',
      }),
    });

    expect(result.contentId).toBe('555');
  });

  it('throws TourApiNotFoundError when detail is missing', async () => {
    mockClient.get.mockResolvedValue(
      createApiResponse({
        items: { item: [] },
      })
    );

    await expect(service.getDetail('999')).rejects.toBeInstanceOf(TourApiNotFoundError);
  });

  it('returns image URLs for getImages', async () => {
    mockClient.get.mockResolvedValue(
      createApiResponse({
        items: {
          item: [
            { originimgurl: 'https://img.example/a.jpg' },
            { originimgurl: 'https://img.example/b.jpg' },
          ],
        },
      })
    );

    const images = await service.getImages('321');
    expect(mockClient.get).toHaveBeenCalledWith('/detailImage1', {
      params: expect.objectContaining({
        contentId: '321',
        imageYN: 'Y',
      }),
    });
    expect(images).toEqual(['https://img.example/a.jpg', 'https://img.example/b.jpg']);
  });

  it('returns area codes list', async () => {
    mockClient.get.mockResolvedValue(
      createApiResponse({
        items: {
          item: [
            { code: '1', name: 'Seoul' },
            { code: '2', name: 'Busan' },
          ],
        },
      })
    );

    const areas = await service.getAreaCodes();
    expect(mockClient.get).toHaveBeenCalledWith('/areaCode1', {
      params: expect.objectContaining({
        MobileOS: 'ETC',
      }),
    });
    expect(areas).toEqual([
      { code: 1, name: 'Seoul' },
      { code: 2, name: 'Busan' },
    ]);
  });

  it('retries failed requests up to three attempts', async () => {
    const apiLocation = {
      contentid: '123',
      contenttypeid: '12',
      title: 'Temple',
    };

    mockClient.get
      .mockRejectedValueOnce(createAxiosError({ code: 'ECONNABORTED' }))
      .mockRejectedValueOnce(createAxiosError({ code: 'ECONNRESET' }))
      .mockResolvedValue(
        createApiResponse({
          items: { item: [apiLocation] },
          totalCount: 1,
          pageNo: 1,
          numOfRows: 10,
        })
      );

    vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);

    const result = await service.search({ keyword: 'history' });

    expect(mockClient.get).toHaveBeenCalledTimes(3);
    expect(result.items).toHaveLength(1);
  });

  it('throws network error after exhausting retries', async () => {
    mockClient.get.mockRejectedValue(createAxiosError({ code: 'ECONNRESET' }));

    vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);

    await expect(service.getAreaCodes()).rejects.toBeInstanceOf(TourApiNetworkError);
    expect(mockClient.get).toHaveBeenCalledTimes(3);
  });

  it('wraps rate limit errors', async () => {
    mockClient.get.mockRejectedValue(
      createAxiosError({
        response: { status: 429, statusText: 'Too Many Requests' },
      })
    );

    await expect(service.search({ keyword: 'culture' })).rejects.toBeInstanceOf(TourApiRateLimitError);
  });
});
