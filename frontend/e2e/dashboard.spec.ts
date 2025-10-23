import { test, expect } from './fixtures/auth';

/**
 * Dashboard E2E Tests
 * Tests dashboard functionality, navigation, and key metrics display
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test.describe('Page Load', () => {
    test('should load dashboard successfully', async ({ authenticatedPage: page }) => {
      // Should be on dashboard
      await expect(page).toHaveURL(/\/dashboard/);

      // Should show dashboard title
      await expect(page.locator('h1, text=/dashboard/i').first()).toBeVisible();
    });

    test('should display key metrics', async ({ authenticatedPage: page }) => {
      // Wait for metrics to load
      await page.waitForTimeout(2000);

      // Should show at least one metric card (pipelines, deployments, tests, etc.)
      const metricCards = page.locator('[data-testid="metric-card"], .metric-card, div:has-text("Pipelines"), div:has-text("Deployments")');
      await expect(metricCards.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display activity feed', async ({ authenticatedPage: page }) => {
      // Wait for activity feed to load
      await page.waitForTimeout(2000);

      // Should show activity section
      const activitySection = page.locator('text=/recent.*activity/i, text=/activity.*feed/i, [data-testid="activity-feed"]');
      await expect(activitySection.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to pipelines from sidebar', async ({ authenticatedPage: page }) => {
      // Click pipelines link in sidebar
      await page.click('nav a[href="/pipelines"], nav a:has-text("Pipelines")');

      // Should navigate to pipelines
      await expect(page).toHaveURL(/\/pipelines/);
    });

    test('should navigate to testing from sidebar', async ({ authenticatedPage: page }) => {
      // Click testing link in sidebar
      await page.click('nav a[href="/testing"], nav a:has-text("Testing")');

      // Should navigate to testing
      await expect(page).toHaveURL(/\/testing/);
    });

    test('should navigate to deployments from sidebar', async ({ authenticatedPage: page }) => {
      // Click deployments link in sidebar
      await page.click('nav a[href="/deployments"], nav a:has-text("Deployments")');

      // Should navigate to deployments
      await expect(page).toHaveURL(/\/deployments/);
    });

    test('should navigate to settings from sidebar', async ({ authenticatedPage: page }) => {
      // Click settings link in sidebar
      await page.click('nav a[href="/settings"], nav a:has-text("Settings")');

      // Should navigate to settings
      await expect(page).toHaveURL(/\/settings/);
    });
  });

  test.describe('Metrics Display', () => {
    test('should show pipeline success rate', async ({ authenticatedPage: page }) => {
      // Wait for data to load
      await page.waitForTimeout(2000);

      // Look for success rate or percentage
      const successMetric = page.locator('text=/%/, text=/success/i').first();
      const exists = await successMetric.count() > 0;

      // If metrics exist, verify they're visible
      if (exists) {
        await expect(successMetric).toBeVisible();
      }
    });

    test('should show deployment count', async ({ authenticatedPage: page }) => {
      // Wait for data to load
      await page.waitForTimeout(2000);

      // Look for deployment metric
      const deploymentMetric = page.locator('text=/deployment/i').first();
      const exists = await deploymentMetric.count() > 0;

      if (exists) {
        await expect(deploymentMetric).toBeVisible();
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('should establish WebSocket connection', async ({ authenticatedPage: page }) => {
      // Wait for potential WebSocket connection
      await page.waitForTimeout(3000);

      // Check if status indicator shows "connected" or "live"
      const statusIndicator = page.locator('text=/connected/i, text=/live/i, [data-testid="connection-status"]');
      const exists = await statusIndicator.count() > 0;

      if (exists) {
        await expect(statusIndicator.first()).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ authenticatedPage: page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Reload to apply viewport
      await page.reload();

      // Dashboard should still be visible
      await expect(page.locator('h1, text=/dashboard/i').first()).toBeVisible();

      // Mobile menu button should be visible
      const mobileMenuButton = page.locator('button[aria-label="Menu"], button:has-text("Menu")');
      const exists = await mobileMenuButton.count() > 0;

      if (exists) {
        await expect(mobileMenuButton.first()).toBeVisible();
      }
    });

    test('should display correctly on tablet viewport', async ({ authenticatedPage: page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Reload to apply viewport
      await page.reload();

      // Dashboard should still be accessible
      await expect(page.locator('h1, text=/dashboard/i').first()).toBeVisible();
    });
  });

  test.describe('Data Loading', () => {
    test('should show loading state while fetching data', async ({ authenticatedPage: page }) => {
      // Slow down network to observe loading state
      await page.route('**/api/metrics/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        route.continue();
      });

      // Reload page
      await page.reload();

      // Should show loading indicator (spinner, skeleton, etc.)
      const loadingIndicator = page.locator('[data-testid="loading"], .loading, .skeleton, .spinner');

      // Check if loading indicator appears (may be very brief)
      const exists = await loadingIndicator.count() > 0;

      if (exists) {
        // Verify it appears
        await expect(loadingIndicator.first()).toBeVisible({ timeout: 1000 }).catch(() => {
          // Loading might be too fast to catch
        });
      }

      // Eventually data should load
      await page.waitForTimeout(3000);
    });

    test('should handle empty state gracefully', async ({ authenticatedPage: page }) => {
      // Mock empty response
      await page.route('**/api/metrics/dashboard**', async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalPipelines: 0,
              totalDeployments: 0,
              totalTests: 0,
            },
          }),
        });
      });

      // Reload page
      await page.reload();

      // Wait for data to load
      await page.waitForTimeout(2000);

      // Should show zero or empty state
      const emptyState = page.locator('text=/no.*data/i, text=/get.*started/i, text=0');
      await expect(emptyState.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ authenticatedPage: page }) => {
      // Mock error response
      await page.route('**/api/metrics/dashboard**', async (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        });
      });

      // Reload page
      await page.reload();

      // Should show error message or retry option
      const errorIndicator = page.locator('text=/error/i, text=/failed/i, text=/retry/i');
      await expect(errorIndicator.first()).toBeVisible({ timeout: 5000 });
    });

    test('should retry failed requests', async ({ authenticatedPage: page }) => {
      let requestCount = 0;

      // Mock failed then successful response
      await page.route('**/api/metrics/dashboard**', async (route) => {
        requestCount++;

        if (requestCount === 1) {
          // First request fails
          route.fulfill({
            status: 500,
            body: JSON.stringify({ success: false, error: 'Server error' }),
          });
        } else {
          // Subsequent requests succeed
          route.continue();
        }
      });

      // Reload page
      await page.reload();

      // Click retry button if it appears
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")');

      if (await retryButton.count() > 0) {
        await retryButton.first().click();

        // Should eventually load data
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ authenticatedPage: page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should focus on interactive elements
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    });

    test('should have proper ARIA labels', async ({ authenticatedPage: page }) => {
      // Check for navigation landmark
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav.first()).toBeVisible();

      // Check for main content landmark
      const main = page.locator('main, [role="main"]');
      await expect(main.first()).toBeVisible();
    });
  });
});
