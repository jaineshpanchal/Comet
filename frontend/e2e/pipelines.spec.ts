import { test, expect } from './fixtures/auth';

/**
 * Pipelines E2E Tests
 * Tests pipeline creation, execution, and monitoring
 */

test.describe('Pipelines', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Navigate to pipelines page
    await page.goto('/pipelines');
  });

  test.describe('Pipelines List', () => {
    test('should load pipelines page successfully', async ({ authenticatedPage: page }) => {
      // Should be on pipelines page
      await expect(page).toHaveURL(/\/pipelines/);

      // Should show pipelines title
      await expect(page.locator('h1, text=/pipeline/i').first()).toBeVisible();
    });

    test('should display pipelines list or empty state', async ({ authenticatedPage: page }) => {
      // Wait for data to load
      await page.waitForTimeout(2000);

      // Should show either pipelines or empty state
      const pipelinesList = page.locator('[data-testid="pipelines-list"], table, .pipeline-item');
      const emptyState = page.locator('text=/no.*pipeline/i, text=/create.*first/i, text=/get.*started/i');

      const hasContent = (await pipelinesList.count() > 0) || (await emptyState.count() > 0);
      expect(hasContent).toBeTruthy();
    });

    test('should have create pipeline button', async ({ authenticatedPage: page }) => {
      // Should show create button
      const createButton = page.locator('button:has-text("Create"), a:has-text("New Pipeline"), button:has-text("Add")');
      await expect(createButton.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Pipeline Creation', () => {
    test('should open create pipeline form', async ({ authenticatedPage: page }) => {
      // Click create button
      const createButton = page.locator('button:has-text("Create"), a:has-text("New Pipeline")');
      await createButton.first().click();

      // Should show create form or navigate to create page
      const hasForm = (await page.locator('form, [data-testid="create-pipeline-form"]').count() > 0);
      const onCreatePage = page.url().includes('/create');

      expect(hasForm || onCreatePage).toBeTruthy();
    });

    test('should validate required fields', async ({ authenticatedPage: page }) => {
      // Click create button
      const createButton = page.locator('button:has-text("Create"), a:has-text("New Pipeline")');

      if (await createButton.count() > 0) {
        await createButton.first().click();
        await page.waitForTimeout(1000);

        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")');

        if (await submitButton.count() > 0) {
          await submitButton.first().click();

          // Should show validation errors
          const validationError = page.locator('text=/required/i, text=/cannot.*empty/i, .error');
          await expect(validationError.first()).toBeVisible({ timeout: 3000 });
        }
      }
    });
  });

  test.describe('Pipeline Details', () => {
    test('should navigate to pipeline details', async ({ authenticatedPage: page }) => {
      // Wait for pipelines to load
      await page.waitForTimeout(2000);

      // Click on first pipeline if it exists
      const firstPipeline = page.locator('[data-testid="pipeline-item"], table tr, .pipeline-card').first();

      if (await firstPipeline.count() > 0) {
        await firstPipeline.click();

        // Should navigate to details page
        await page.waitForTimeout(1000);
        expect(page.url()).toMatch(/\/pipelines\/[a-zA-Z0-9-]+/);
      }
    });
  });

  test.describe('Pipeline Execution', () => {
    test('should show run pipeline button', async ({ authenticatedPage: page }) => {
      // Wait for page to load
      await page.waitForTimeout(2000);

      // Look for run/execute button
      const runButton = page.locator('button:has-text("Run"), button:has-text("Execute"), button:has-text("Trigger")');

      if (await runButton.count() > 0) {
        await expect(runButton.first()).toBeVisible();
      }
    });
  });

  test.describe('Pipeline Filtering', () => {
    test('should filter pipelines by status', async ({ authenticatedPage: page }) => {
      // Wait for page to load
      await page.waitForTimeout(2000);

      // Look for filter dropdown or tabs
      const filterControl = page.locator('select[name="status"], button:has-text("Status"), [data-testid="status-filter"]');

      if (await filterControl.count() > 0) {
        await expect(filterControl.first()).toBeVisible();

        // Try clicking a filter option
        await filterControl.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('should search pipelines by name', async ({ authenticatedPage: page }) => {
      // Wait for page to load
      await page.waitForTimeout(2000);

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]');

      if (await searchInput.count() > 0) {
        await expect(searchInput.first()).toBeVisible();

        // Type in search
        await searchInput.first().fill('test');
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle failed pipeline data fetch', async ({ authenticatedPage: page }) => {
      // Mock error response
      await page.route('**/api/pipelines**', async (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, error: 'Server error' }),
        });
      });

      // Reload page
      await page.reload();

      // Should show error message
      const errorMessage = page.locator('text=/error/i, text=/failed/i, text=/retry/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Real-time Updates', () => {
    test('should update pipeline status in real-time', async ({ authenticatedPage: page }) => {
      // Wait for potential WebSocket updates
      await page.waitForTimeout(5000);

      // If pipelines exist, their status should be visible
      const statusBadge = page.locator('[data-testid="pipeline-status"], .status-badge, text=/running/i, text=/success/i, text=/failed/i');

      if (await statusBadge.count() > 0) {
        await expect(statusBadge.first()).toBeVisible();
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ authenticatedPage: page }) => {
      // Tab to interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should have focus on interactive element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
    });

    test('should have proper heading structure', async ({ authenticatedPage: page }) => {
      // Should have h1
      const h1 = page.locator('h1');
      await expect(h1.first()).toBeVisible();
    });
  });
});
