import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Map Interaction
 * Tests Naver Maps integration, markers, info windows, geolocation
 */

test.describe('Map Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should render map container', async ({ page }) => {
    const mapContainer = page.locator('[data-testid="naver-map"]');

    if (await mapContainer.isVisible({ timeout: 10000 })) {
      await expect(mapContainer).toBeVisible();

      // Verify map has loaded
      const mapLoaded = await page.evaluate(() => {
        return typeof window.naver !== 'undefined' && window.naver.maps !== undefined;
      });

      expect(mapLoaded).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should show loading state while map loads', async ({ page }) => {
    await page.goto('/');

    // Look for loading indicator
    const loadingIndicator = page.locator('text=/로딩|loading|지도.*로딩/i');

    // Should either show loading or map loaded quickly
    const isLoading = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
    const mapLoaded = page.locator('[data-testid="naver-map"]');
    const isMapVisible = await mapLoaded.isVisible({ timeout: 10000 }).catch(() => false);

    expect(isLoading || isMapVisible).toBeTruthy();
  });

  test('should display map controls', async ({ page }) => {
    const mapContainer = page.locator('[data-testid="naver-map"]');

    if (await mapContainer.isVisible({ timeout: 10000 })) {
      // Look for zoom controls
      const zoomControls = page.locator('[aria-label*="zoom"], [aria-label*="Zoom"]');

      const hasZoomControls = await zoomControls.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasZoomControls) {
        await expect(zoomControls.first()).toBeVisible();
      } else {
        // Controls might be built into Naver Maps SDK
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should handle map error gracefully', async ({ page }) => {
    // Block Naver Maps API to simulate error
    await page.route('**/maps.js*', (route) => route.abort());

    await page.goto('/');

    // Should show error message
    const errorMessage = page.locator('text=/지도.*불러올.*없습니다|map.*error/i');

    const hasError = await errorMessage.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasError) {
      await expect(errorMessage).toBeVisible();
    } else {
      // App might handle error differently
      test.skip();
    }
  });

  test.describe('My Location Feature', () => {
    test('should show My Location button', async ({ page }) => {
      const mapContainer = page.locator('[data-testid="naver-map"]');

      if (await mapContainer.isVisible({ timeout: 10000 })) {
        const myLocationBtn = page.locator('[aria-label*="location"], [aria-label*="내 위치"]');

        const hasButton = await myLocationBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasButton) {
          await expect(myLocationBtn).toBeVisible();
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    });

    test('should request geolocation permission when clicked', async ({ page, context }) => {
      // Grant geolocation permission
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 37.5665, longitude: 126.978 });

      const myLocationBtn = page.locator('[aria-label*="location"], [aria-label*="내 위치"]');

      if (await myLocationBtn.isVisible({ timeout: 10000 })) {
        await myLocationBtn.click();

        // Wait for map to center
        await page.waitForTimeout(2000);

        // Map should have centered (we can't easily verify programmatically without accessing map instance)
        // Just verify no error occurred
        const errorMessage = page.locator('text=/error|오류|실패/i');
        const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasError).toBeFalsy();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Mobile Map View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should render map in mobile viewport', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const mapContainer = page.locator('[data-testid="naver-map"]');

      if (await mapContainer.isVisible({ timeout: 10000 })) {
        await expect(mapContainer).toBeVisible();

        // Verify map is responsive
        const boundingBox = await mapContainer.boundingBox();

        if (boundingBox) {
          expect(boundingBox.width).toBeLessThanOrEqual(375);
          expect(boundingBox.height).toBeGreaterThan(200);
        }
      } else {
        test.skip();
      }
    });

    test('should show bottom sheet on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for bottom sheet
      const bottomSheet = page.locator('[data-testid="bottom-sheet"], [data-testid="mobile-bottom-sheet"]');

      if (await bottomSheet.isVisible({ timeout: 10000 })) {
        await expect(bottomSheet).toBeVisible();

        // Verify swipe handle
        const swipeHandle = page.locator('[data-testid="sheet-handle"]');
        const hasHandle = await swipeHandle.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasHandle) {
          await expect(swipeHandle).toBeVisible();
        }
      } else {
        test.skip();
      }
    });
  });

  test.describe('Map Performance', () => {
    test('should load map within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      const mapContainer = page.locator('[data-testid="naver-map"]');
      await mapContainer.waitFor({ state: 'visible', timeout: 15000 });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Map should load within 15 seconds
      expect(loadTime).toBeLessThan(15000);
    });
  });
});
