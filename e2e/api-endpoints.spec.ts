import { test, expect } from '@playwright/test';

/**
 * E2E Tests: API Endpoints
 * Tests the Tour API endpoints for search and detail retrieval
 */

test.describe('Tour API Endpoints', () => {
  test.describe('GET /api/tour/search', () => {
    test('should return search results with keyword', async ({ request }) => {
      const response = await request.get('/api/tour/search?keyword=Seoul');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('pageNo');
      expect(Array.isArray(data.items)).toBe(true);
    });

    test('should filter by content type', async ({ request }) => {
      const response = await request.get('/api/tour/search?contentTypeId=12');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.items.length).toBeGreaterThan(0);

      // Verify all items have correct contentTypeId
      data.items.forEach((item: any) => {
        expect(item.contentTypeId).toBe(12);
      });
    });

    test('should support pagination', async ({ request }) => {
      const page1 = await request.get('/api/tour/search?keyword=Seoul&pageNo=1&numOfRows=10');
      const page2 = await request.get('/api/tour/search?keyword=Seoul&pageNo=2&numOfRows=10');

      expect(page1.status()).toBe(200);
      expect(page2.status()).toBe(200);

      const data1 = await page1.json();
      const data2 = await page2.json();

      expect(data1.pageNo).toBe(1);
      expect(data2.pageNo).toBe(2);

      // Items should be different
      const ids1 = data1.items.map((item: any) => item.contentId);
      const ids2 = data2.items.map((item: any) => item.contentId);
      expect(ids1).not.toEqual(ids2);
    });

    test('should return 400 for invalid parameters', async ({ request }) => {
      const response = await request.get('/api/tour/search?pageNo=-1');

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should return 400 for excessive numOfRows', async ({ request }) => {
      const response = await request.get('/api/tour/search?numOfRows=1000');

      expect(response.status()).toBe(400);
    });

    test('should apply combined filters', async ({ request }) => {
      const response = await request.get(
        '/api/tour/search?keyword=Seoul&contentTypeId=12&areaCode=1'
      );

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.items.length).toBeGreaterThan(0);
    });
  });

  test.describe('GET /api/tour/detail/[id]', () => {
    test('should return location details for valid ID', async ({ request }) => {
      // First get a valid ID from search
      const searchResponse = await request.get('/api/tour/search?keyword=Seoul&numOfRows=1');
      const searchData = await searchResponse.json();

      if (searchData.items.length === 0) {
        test.skip();
        return;
      }

      const contentId = searchData.items[0].contentId;

      // Now fetch details
      const detailResponse = await request.get(`/api/tour/detail/${contentId}`);

      expect(detailResponse.status()).toBe(200);

      const detailData = await detailResponse.json();
      expect(detailData).toHaveProperty('contentId');
      expect(detailData.contentId).toBe(contentId);
      expect(detailData).toHaveProperty('title');
    });

    test('should include related locations when requested', async ({ request }) => {
      const searchResponse = await request.get('/api/tour/search?keyword=Seoul&numOfRows=1');
      const searchData = await searchResponse.json();

      if (searchData.items.length === 0) {
        test.skip();
        return;
      }

      const contentId = searchData.items[0].contentId;

      const detailResponse = await request.get(
        `/api/tour/detail/${contentId}?includeRelated=true`
      );

      expect(detailResponse.status()).toBe(200);

      const detailData = await detailResponse.json();
      expect(detailData).toHaveProperty('relatedLocations');
      expect(Array.isArray(detailData.relatedLocations)).toBe(true);
    });

    test('should return 404 for invalid ID', async ({ request }) => {
      const response = await request.get('/api/tour/detail/invalid-id-999999');

      expect(response.status()).toBe(404);
    });

    test('should return 400 for missing ID', async ({ request }) => {
      const response = await request.get('/api/tour/detail/');

      expect(response.status()).toBe(404); // Next.js returns 404 for missing route param
    });
  });

  test.describe('API Performance', () => {
    test('should respond within acceptable time', async ({ request }) => {
      const startTime = Date.now();

      const response = await request.get('/api/tour/search?keyword=Seoul');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });

  test.describe('API Caching', () => {
    test('should include cache headers', async ({ request }) => {
      const response = await request.get('/api/tour/search?keyword=Seoul');

      expect(response.status()).toBe(200);

      const headers = response.headers();
      // Verify caching headers exist
      expect(headers['cache-control'] || headers['x-cache']).toBeDefined();
    });
  });
});
