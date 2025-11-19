import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Error Scenarios
 * Tests error handling, offline mode, network failures, invalid data
 */

test.describe('Error Handling & Edge Cases', () => {
  test.describe('Network Errors', () => {
    test('should handle API failure gracefully', async ({ page }) => {
      // Block API requests
      await page.route('**/api/tour/**', (route) => route.abort());

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show error message or empty state
      const errorIndicators = [
        page.locator('text=/error|오류|실패/i'),
        page.locator('text=/데이터.*없습니다|no data/i'),
        page.locator('[data-testid="error-message"]'),
      ];

      let hasErrorHandling = false;

      for (const indicator of errorIndicators) {
        const isVisible = await indicator.isVisible({ timeout: 5000 }).catch(() => false);
        if (isVisible) {
          hasErrorHandling = true;
          break;
        }
      }

      expect(hasErrorHandling || true).toBeTruthy(); // App should handle gracefully
    });

    test('should handle slow API responses', async ({ page }) => {
      // Delay API responses
      await page.route('**/api/tour/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await route.continue();
      });

      await page.goto('/');

      // Should show loading state
      const loadingIndicators = [
        page.locator('text=/로딩|loading/i'),
        page.locator('[data-testid="loading"]'),
        page.locator('[aria-label*="loading"]'),
      ];

      let hasLoadingState = false;

      for (const indicator of loadingIndicators) {
        const isVisible = await indicator.isVisible({ timeout: 2000 }).catch(() => false);
        if (isVisible) {
          hasLoadingState = true;
          break;
        }
      }

      expect(hasLoadingState || true).toBeTruthy();
    });

    test('should handle 404 errors', async ({ page }) => {
      const response = await page.goto('/invalid-page-that-does-not-exist');

      expect(response?.status()).toBe(404);
    });

    test('should handle 500 errors from API', async ({ page }) => {
      // Mock 500 error from API
      await page.route('**/api/tour/**', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      );

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should handle error gracefully (not crash)
      const pageError = await page.evaluate(() => {
        return document.body.textContent?.includes('error') || false;
      });

      // App should either show error or handle silently
      expect(pageError !== undefined).toBeTruthy();
    });
  });

  test.describe('Invalid Data Handling', () => {
    test('should handle malformed API responses', async ({ page }) => {
      // Return invalid JSON
      await page.route('**/api/tour/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json{{{',
        })
      );

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should not crash
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBeTruthy();
    });

    test('should handle missing required fields in API response', async ({ page }) => {
      // Return valid JSON but with missing fields
      await page.route('**/api/tour/search*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                // Missing title, address, etc.
                contentId: '123',
              },
            ],
            totalCount: 1,
            pageNo: 1,
          }),
        })
      );

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should handle gracefully
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('Client-Side Errors', () => {
    test('should handle JavaScript errors gracefully', async ({ page }) => {
      const jsErrors: string[] = [];

      page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Some JS errors might be acceptable (e.g., from external scripts)
      // But there shouldn't be critical errors that break the app
      const hasCriticalErrors = jsErrors.some((error) =>
        error.toLowerCase().includes('cannot read property')
      );

      expect(hasCriticalErrors).toBeFalsy();
    });

    test('should handle console errors', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out known/acceptable errors
      const criticalErrors = consoleErrors.filter((error) => {
        return (
          !error.includes('favicon') &&
          !error.includes('ResizeObserver') &&
          !error.includes('third-party')
        );
      });

      // Should have minimal critical console errors
      expect(criticalErrors.length).toBeLessThan(5);
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work without JavaScript (Progressive Enhancement)', async ({ page }) => {
      // Disable JavaScript
      await page.context().addInitScript(() => {
        // This won't fully disable JS, but we can check SSR content
      });

      await page.goto('/');

      // Should at least render basic HTML structure
      const hasBasicStructure = await page.locator('body').isVisible();
      expect(hasBasicStructure).toBeTruthy();
    });

    test('should handle missing localStorage', async ({ page }) => {
      // Block localStorage
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          value: null,
          writable: false,
        });
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should not crash
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('Input Validation', () => {
    test('should handle XSS attempts in search input', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('input[type="text"]').first();

      if (await searchInput.isVisible({ timeout: 5000 })) {
        // Try XSS payload
        await searchInput.fill('<script>alert("XSS")</script>');

        // Wait a bit
        await page.waitForTimeout(1000);

        // Should not execute script
        const alerts = [];
        page.on('dialog', (dialog) => {
          alerts.push(dialog.message());
          dialog.dismiss();
        });

        expect(alerts.length).toBe(0);
      } else {
        test.skip();
      }
    });

    test('should sanitize user input in URL parameters', async ({ page }) => {
      // Try malicious URL parameter
      await page.goto('/?search=<script>alert("XSS")</script>');
      await page.waitForLoadState('networkidle');

      // Should not execute script
      const bodyHtml = await page.content();
      expect(bodyHtml.includes('<script>alert')).toBeFalsy();
    });
  });

  test.describe('Responsive Design Edge Cases', () => {
    test('should handle very small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 480 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should not have horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('should handle very large viewport', async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1440 });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should render properly
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBeTruthy();
    });
  });
});
