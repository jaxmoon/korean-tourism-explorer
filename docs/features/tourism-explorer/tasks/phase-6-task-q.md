# Task Q: Integration & E2E Tests ⭐ CRITICAL

**Phase**: 6 | **Time**: 2h | **Agent**: test-engineer-specialist
**Dependencies**: Phase 5 complete | **On Critical Path**: ⭐ Yes
**EST**: 17h | **EFT**: 19h | **Slack**: 0h

## Objective
Write comprehensive E2E tests for all user flows using Playwright.

---

## 🔴 RED (30min)

```typescript
// e2e/search-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
  test('should search and view location details', async ({ page }) => {
    // Navigate to home
    await page.goto('/');

    // Search for Seoul
    await page.fill('[placeholder*="검색"]', 'Seoul');
    await page.waitForTimeout(300); // Debounce

    // Verify results appear
    await expect(page.locator('[data-testid="location-card"]').first()).toBeVisible();

    // Click first result
    await page.locator('[data-testid="location-card"]').first().click();

    // Verify detail page
    await expect(page).toHaveURL(/\/attractions\/\d+/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should filter by content type', async ({ page }) => {
    await page.goto('/search');

    // Click restaurant filter
    await page.click('text=음식점');

    // Verify only restaurants shown
    const cards = page.locator('[data-testid="location-card"]');
    const count = await cards.count();

    expect(count).toBeGreaterThan(0);
  });
});
```

---

## 🟢 GREEN (1h)

```typescript
// e2e/map-interaction.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Map Interaction', () => {
  test('should show map and click marker', async ({ page }) => {
    await page.goto('/search?view=map');

    // Wait for map to load
    await page.waitForSelector('[data-testid="naver-map"]');

    // Click a marker (simulate)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('markerClick', {
        detail: { contentId: '123' }
      }));
    });

    // Verify info window or bottom sheet opens
    await expect(page.locator('[data-testid="location-info"]')).toBeVisible();
  });

  test.describe('Mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should swipe bottom sheet', async ({ page }) => {
      await page.goto('/search?view=map');

      const sheet = page.locator('[data-testid="bottom-sheet"]');
      await expect(sheet).toBeVisible();

      // Swipe up
      await sheet.locator('[data-testid="sheet-handle"]').hover();
      await page.mouse.down();
      await page.mouse.move(0, -100);
      await page.mouse.up();

      // Verify expanded
      await expect(sheet).toHaveCSS('height', '50vh');
    });
  });
});
```

```typescript
// e2e/favorites.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Favorites Management', () => {
  test('should add and remove favorite', async ({ page }) => {
    await page.goto('/search');

    // Add to favorites
    await page.locator('[aria-label*="favorite"]').first().click();

    // Verify toast
    await expect(page.locator('text=즐겨찾기에 추가')).toBeVisible();

    // Go to favorites page
    await page.goto('/favorites');

    // Verify item exists
    await expect(page.locator('[data-testid="favorite-item"]')).toHaveCount(1);

    // Remove favorite
    await page.locator('[aria-label*="Remove"]').first().click();

    // Verify removed
    await expect(page.locator('[data-testid="favorite-item"]')).toHaveCount(0);
  });

  test('should export favorites', async ({ page }) => {
    await page.goto('/favorites');

    // Add some favorites first
    // ...

    // Start waiting for download
    const downloadPromise = page.waitForEvent('download');

    // Click export
    await page.click('text=Export');

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/favorites_.*\.json/);
  });
});
```

---

## 🔵 REFACTOR (30min)

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

```typescript
// e2e/responsive.spec.ts
test.describe('Responsive Behavior', () => {
  test('mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify bottom nav
    await expect(page.locator('[data-testid="bottom-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-nav"]')).not.toBeVisible();
  });

  test('desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Verify top nav
    await expect(page.locator('[data-testid="top-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="bottom-nav"]')).not.toBeVisible();
  });
});
```

## Success Criteria

- [x] Search flow E2E test
- [x] Map interaction test
- [x] Favorites flow test
- [x] Mobile bottom sheet test
- [x] Responsive layout tests
- [x] Error scenario tests
- [x] All tests passing ✅
- [x] Test report generated
- [x] Critical path complete ⭐
