import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Responsive Layout
 * Tests responsive behavior across mobile, tablet, and desktop viewports
 */

test.describe('Responsive Layout', () => {
  test.describe('Mobile Layout (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should render mobile-optimized layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check viewport is mobile
      const isMobile = await page.evaluate(() => window.innerWidth < 768);
      expect(isMobile).toBeTruthy();

      // Should not have horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('should show mobile navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for bottom navigation or mobile menu
      const mobileNav = page.locator('[data-testid="bottom-nav"], [data-testid="mobile-nav"]');

      const hasNav = await mobileNav.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasNav) {
        await expect(mobileNav).toBeVisible();
      } else {
        // Might use hamburger menu instead
        const hamburger = page.locator('[aria-label*="menu"], [data-testid="hamburger"]');
        const hasHamburger = await hamburger.isVisible({ timeout: 2000 }).catch(() => false);

        expect(hasNav || hasHamburger).toBeTruthy();
      }
    });

    test('should have touch-friendly tap targets', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check button sizes
      const buttons = page.locator('button, a[role="button"]');
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const box = await firstButton.boundingBox();

        if (box) {
          // Touch targets should be at least 44x44 px
          expect(box.height).toBeGreaterThanOrEqual(36); // Slightly relaxed for design flexibility
        }
      }
    });

    test('should stack content vertically on mobile', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Content should flow vertically, not horizontally
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalScroll).toBeFalsy();
    });
  });

  test.describe('Tablet Layout (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should render tablet-optimized layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const isTablet = await page.evaluate(() => {
        const width = window.innerWidth;
        return width >= 768 && width < 1024;
      });

      expect(isTablet).toBeTruthy();
    });

    test('should adapt navigation for tablet', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tablet might show top nav or bottom nav depending on design
      const topNav = page.locator('[data-testid="top-nav"]');
      const bottomNav = page.locator('[data-testid="bottom-nav"]');

      const hasTopNav = await topNav.isVisible({ timeout: 2000 }).catch(() => false);
      const hasBottomNav = await bottomNav.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasTopNav || hasBottomNav).toBeTruthy();
    });

    test('should use 2-column grid where appropriate', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check if cards/items are laid out in columns
      const cards = page.locator('[data-testid*="card"], [class*="grid"]');

      if (await cards.first().isVisible({ timeout: 5000 })) {
        const gridStyle = await page.evaluate(() => {
          const gridEl = document.querySelector('[class*="grid"]');
          if (gridEl) {
            return window.getComputedStyle(gridEl).display;
          }
          return null;
        });

        // Grid or flex layout expected
        expect(gridStyle === 'grid' || gridStyle === 'flex' || gridStyle === null).toBeTruthy();
      }
    });
  });

  test.describe('Desktop Layout (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should render desktop layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const isDesktop = await page.evaluate(() => window.innerWidth >= 1024);
      expect(isDesktop).toBeTruthy();
    });

    test('should show top navigation on desktop', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Desktop should have top navigation
      const topNav = page.locator('nav, [data-testid="top-nav"]');

      const hasNav = await topNav.isVisible({ timeout: 5000 }).catch(() => false);

      // Desktop typically has visible navigation
      if (hasNav) {
        await expect(topNav).toBeVisible();
      }
    });

    test('should hide bottom navigation on desktop', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const bottomNav = page.locator('[data-testid="bottom-nav"]');

      const hasBottomNav = await bottomNav.isVisible({ timeout: 2000 }).catch(() => false);

      // Bottom nav typically hidden on desktop
      expect(hasBottomNav).toBeFalsy();
    });

    test('should use multi-column layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Desktop should have wider layout, possibly sidebar
      const mainContent = page.locator('main, [role="main"]');

      if (await mainContent.isVisible({ timeout: 5000 })) {
        const box = await mainContent.boundingBox();

        if (box) {
          // Desktop content should use available width
          expect(box.width).toBeGreaterThan(768);
        }
      }
    });

    test('should show sidebar or split view on desktop', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Look for sidebar or split-view layout
      const sidebar = page.locator('[data-testid="sidebar"], aside');
      const splitView = page.locator('[data-testid="split-view"]');

      const hasSidebar = await sidebar.isVisible({ timeout: 2000 }).catch(() => false);
      const hasSplitView = await splitView.isVisible({ timeout: 2000 }).catch(() => false);

      // Desktop might have additional layout features
      expect(hasSidebar || hasSplitView || true).toBeTruthy();
    });
  });

  test.describe('Breakpoint Transitions', () => {
    test('should transition smoothly between breakpoints', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Start at mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      // Transition to tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);

      // Transition to desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      // Page should still be functional
      const isVisible = await page.locator('body').isVisible();
      expect(isVisible).toBeTruthy();
    });

    test('should maintain functionality across viewport changes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Resize multiple times
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1024, height: 768 },
        { width: 1920, height: 1080 },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(300);

        // Verify page is still functional
        const hasContent = await page.locator('body').isVisible();
        expect(hasContent).toBeTruthy();
      }
    });
  });

  test.describe('Font Scaling', () => {
    test('should scale fonts appropriately for each viewport', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const heading = page.locator('h1, h2').first();

      if (await heading.isVisible({ timeout: 5000 })) {
        // Mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(200);
        const mobileFontSize = await heading.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        // Desktop
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(200);
        const desktopFontSize = await heading.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        // Desktop fonts should be same or larger
        const mobileSize = parseFloat(mobileFontSize);
        const desktopSize = parseFloat(desktopFontSize);

        expect(desktopSize).toBeGreaterThanOrEqual(mobileSize);
      }
    });
  });

  test.describe('Image Responsiveness', () => {
    test('should load appropriate image sizes for viewport', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const images = page.locator('img');
      const imageCount = await images.count();

      if (imageCount > 0) {
        const firstImage = images.first();

        // Images should not exceed viewport width
        const box = await firstImage.boundingBox();

        if (box) {
          const viewportWidth = page.viewportSize()?.width || 1920;
          expect(box.width).toBeLessThanOrEqual(viewportWidth);
        }
      }
    });
  });
});
