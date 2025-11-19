import https from 'https';
import axios, { AxiosInstance, AxiosError } from 'axios';

import { config } from '@/lib/config';
import { Location } from '@/lib/models/location';
import { SearchParams } from '@/lib/models/search-params';
import { transformApiLocation } from '@/lib/models/helpers';
import {
  TourApiError,
  TourApiNetworkError,
  TourApiNotFoundError,
  TourApiRateLimitError,
} from './errors';

export class TourApiService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
  private maxRetries = 2; // 2 retries + 1 initial = 3 total attempts
  private retryDelay = 1000;

  constructor() {
    this.baseUrl = config.tourApi.baseUrl;
    this.apiKey = config.tourApi.key;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'User-Agent': 'Node.js',
        'Accept': '*/*',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        // Log the full URL with query params
        console.log(`[TourAPI] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        console.log(`[TourAPI] Headers:`, JSON.stringify(config.headers));
        console.log(`[TourAPI] Params:`, JSON.stringify(config.params));
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[TourAPI] Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('[TourAPI] Error:', error.message);
        if (error.response) {
          console.error('[TourAPI] Status:', error.response.status);
          console.error('[TourAPI] Response data:', JSON.stringify(error.response.data));
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search locations by keyword and filters
   */
  async search(params: SearchParams): Promise<{
    items: Location[];
    totalCount: number;
    pageNo: number;
    numOfRows: number;
  }> {
    // Build params in the exact order as the API preview
    const searchParams = new URLSearchParams();
    searchParams.append('serviceKey', this.apiKey);
    searchParams.append('numOfRows', String(params.numOfRows || 20));
    searchParams.append('pageNo', String(params.pageNo || 1));
    searchParams.append('MobileOS', 'ETC');
    searchParams.append('MobileApp', 'TourismExplorer');
    searchParams.append('_type', 'json');

    if (params.arrange) searchParams.append('arrange', params.arrange);
    if (params.keyword) searchParams.append('keyword', params.keyword);
    if (params.areaCode) searchParams.append('areaCode', String(params.areaCode));
    if (params.sigunguCode) searchParams.append('sigunguCode', String(params.sigunguCode));
    if (params.contentTypeId) searchParams.append('contentTypeId', String(params.contentTypeId));
    if (params.cat1) searchParams.append('cat1', params.cat1);
    if (params.cat2) searchParams.append('cat2', params.cat2);
    if (params.cat3) searchParams.append('cat3', params.cat3);

    const queryString = searchParams.toString();
    const path = `/B551011/KorService2/searchKeyword2?${queryString}`;

    console.log(`[TourAPI] GET https://apis.data.go.kr${path}`);

    // Use Node.js https module instead of axios
    return new Promise((resolve, reject) => {
      https.get({
        hostname: 'apis.data.go.kr',
        path: path,
      }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            if (res.statusCode !== 200) {
              console.error('[TourAPI] Error:', res.statusCode);
              reject(new TourApiError(`Request failed with status code ${res.statusCode}`));
              return;
            }

            if (json.response?.header?.resultCode !== '0000') {
              console.error('[TourAPI] API Error:', json.response?.header?.resultMsg);
              reject(new TourApiError(json.response?.header?.resultMsg || 'API error'));
              return;
            }

            const body = json.response.body;
            const items = body.items?.item || [];

            console.log(`[TourAPI] Response: ${res.statusCode} ${res.statusMessage}`);

            resolve({
              items: items.map(transformApiLocation),
              totalCount: body.totalCount || 0,
              pageNo: body.pageNo || 1,
              numOfRows: body.numOfRows || 20,
            });
          } catch (e) {
            console.error('[TourAPI] Parse error:', e);
            reject(new TourApiError('Failed to parse response'));
          }
        });
      }).on('error', (err) => {
        console.error('[TourAPI] Request error:', err.message);
        reject(new TourApiNetworkError(err.message));
      });
    });
  }

  /**
   * Get location detail by contentId
   */
  async getDetail(contentId: string): Promise<Location> {
    const queryParams = {
      serviceKey: this.apiKey,
      MobileOS: 'ETC',
      MobileApp: 'TourismExplorer',
      _type: 'json',
      contentId,
      defaultYN: 'Y',
      firstImageYN: 'Y',
      areacodeYN: 'Y',
      catcodeYN: 'Y',
      addrinfoYN: 'Y',
      mapinfoYN: 'Y',
      overviewYN: 'Y',
    };

    const response = await this.retryRequest(() =>
      this.client.get('/detailCommon2', { params: queryParams })
    );

    const items = response.data.response.body.items?.item || [];

    if (items.length === 0) {
      throw new TourApiNotFoundError(`Location with id ${contentId} not found`);
    }

    return transformApiLocation(items[0]);
  }

  /**
   * Get location images
   */
  async getImages(contentId: string): Promise<string[]> {
    const queryParams = {
      serviceKey: this.apiKey,
      MobileOS: 'ETC',
      MobileApp: 'TourismExplorer',
      _type: 'json',
      contentId,
      imageYN: 'Y',
      subImageYN: 'Y',
    };

    const response = await this.retryRequest(() =>
      this.client.get('/detailImage2', { params: queryParams })
    );

    const items = response.data.response.body.items?.item || [];

    return items.map((item: any) => item.originimgurl).filter(Boolean);
  }

  /**
   * Get area codes (regions)
   */
  async getAreaCodes(): Promise<{ code: number; name: string }[]> {
    const queryParams = {
      serviceKey: this.apiKey,
      MobileOS: 'ETC',
      MobileApp: 'TourismExplorer',
      _type: 'json',
      numOfRows: 20,
      pageNo: 1,
    };

    const response = await this.retryRequest(() =>
      this.client.get('/areaCode2', { params: queryParams })
    );

    const items = response.data.response.body.items?.item || [];

    return items.map((item: any) => ({
      code: parseInt(item.code),
      name: item.name,
    }));
  }

  /**
   * Get nearby locations based on GPS coordinates
   */
  async getNearbyLocations(params: {
    mapX: number;
    mapY: number;
    radius: number;
    contentTypeId?: number;
    areaCode?: number;
    sigunguCode?: number;
    cat1?: string;
    cat2?: string;
    cat3?: string;
    arrange?: string;
    numOfRows?: number;
    pageNo?: number;
  }): Promise<{
    items: Location[];
    totalCount: number;
    pageNo: number;
    numOfRows: number;
  }> {
    // Build params in the exact order
    const searchParams = new URLSearchParams();
    searchParams.append('serviceKey', this.apiKey);
    searchParams.append('numOfRows', String(params.numOfRows || 20));
    searchParams.append('pageNo', String(params.pageNo || 1));
    searchParams.append('MobileOS', 'ETC');
    searchParams.append('MobileApp', 'TourismExplorer');
    searchParams.append('_type', 'json');
    searchParams.append('arrange', params.arrange || 'E'); // E = 거리순 (distance order)
    searchParams.append('mapX', String(params.mapX));
    searchParams.append('mapY', String(params.mapY));
    searchParams.append('radius', String(Math.min(params.radius, 20000))); // Max 20km

    // Add optional parameters
    if (params.contentTypeId) searchParams.append('contentTypeId', String(params.contentTypeId));
    if (params.areaCode) searchParams.append('areaCode', String(params.areaCode));
    if (params.sigunguCode) searchParams.append('sigunguCode', String(params.sigunguCode));
    if (params.cat1) searchParams.append('cat1', params.cat1);
    if (params.cat2) searchParams.append('cat2', params.cat2);
    if (params.cat3) searchParams.append('cat3', params.cat3);

    const queryString = searchParams.toString();
    const path = `/B551011/KorService2/locationBasedList2?${queryString}`;

    console.log(`[TourAPI] GET https://apis.data.go.kr${path}`);

    // Use Node.js https module instead of axios
    return new Promise((resolve, reject) => {
      https.get({
        hostname: 'apis.data.go.kr',
        path: path,
      }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            if (res.statusCode !== 200) {
              console.error('[TourAPI] Error:', res.statusCode);
              reject(new TourApiError(`Request failed with status code ${res.statusCode}`));
              return;
            }

            if (json.response?.header?.resultCode !== '0000') {
              console.error('[TourAPI] API Error:', json.response?.header?.resultMsg);
              reject(new TourApiError(json.response?.header?.resultMsg || 'API error'));
              return;
            }

            const body = json.response.body;
            const items = body.items?.item || [];

            console.log(`[TourAPI] Response: ${res.statusCode} ${res.statusMessage}`);

            resolve({
              items: items.map(transformApiLocation),
              totalCount: body.totalCount || 0,
              pageNo: body.pageNo || 1,
              numOfRows: body.numOfRows || 20,
            });
          } catch (e) {
            console.error('[TourAPI] Parse error:', e);
            reject(new TourApiError('Failed to parse response'));
          }
        });
      }).on('error', (err) => {
        console.error('[TourAPI] Request error:', err.message);
        reject(new TourApiNetworkError(err.message));
      });
    });
  }

  /**
   * Retry failed requests with exponential backoff
   */
  protected async retryRequest<T>(
    fn: () => Promise<T>,
    retries = this.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(
          `[TourAPI] Retrying... (${this.maxRetries - retries + 1}/${this.maxRetries})`
        );
        const delayMs = this.retryDelay * (this.maxRetries - retries + 1);
        await this.delay(delayMs);
        return this.retryRequest(fn, retries - 1);
      }

      // Transform error before throwing
      throw this.transformError(error);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Check for axios error
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Retry on network errors
      if (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ETIMEDOUT' ||
        axiosError.code === 'ECONNRESET' ||
        axiosError.code === 'ENOTFOUND' ||
        axiosError.code === 'ERR_NETWORK'
      ) {
        return true;
      }

      // Retry on 5xx server errors
      if (axiosError.response && axiosError.response.status >= 500) {
        return true;
      }
    }

    return false;
  }

  /**
   * Transform axios error to custom error
   */
  private transformError(error: any): TourApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Network errors
      if (
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ETIMEDOUT' ||
        axiosError.code === 'ECONNRESET' ||
        axiosError.code === 'ENOTFOUND' ||
        axiosError.code === 'ERR_NETWORK'
      ) {
        return new TourApiNetworkError('Network timeout or connection error');
      }

      // HTTP status errors
      if (axiosError.response) {
        const status = axiosError.response.status;

        if (status === 404) {
          return new TourApiNotFoundError('Resource not found');
        }

        if (status === 429) {
          return new TourApiRateLimitError('Rate limit exceeded');
        }

        return new TourApiError(
          axiosError.message || 'API request failed',
          status,
          axiosError
        );
      }
    }

    return new TourApiError(
      error?.message || 'Unknown API error',
      undefined,
      error
    );
  }

  /**
   * Delay helper
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const tourApiService = new TourApiService();
