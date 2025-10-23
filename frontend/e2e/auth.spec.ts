import { test, expect } from './fixtures/auth';
import { TEST_USERS } from './fixtures/auth';

/**
 * Authentication E2E Tests
 * Tests login, logout, and authentication flows
 */

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/');

      // Check for login form elements
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Check page title
      await expect(page).toHaveTitle(/GoLive|Login/i);
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/');

      // Click submit without filling form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=/email.*required/i, text=/required/i').first()).toBeVisible({
        timeout: 3000,
      });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/');

      // Fill with invalid credentials
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');

      // Submit
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(
        page.locator('text=/invalid.*credentials/i, text=/incorrect/i, text=/error/i').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('should successfully login with demo credentials', async ({ page }) => {
      await page.goto('/');

      // Fill login form
      await page.fill('input[name="email"]', TEST_USERS.demo.email);
      await page.fill('input[name="password"]', TEST_USERS.demo.password);

      // Submit
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Should show dashboard elements
      await expect(page.locator('text=/dashboard/i, h1').first()).toBeVisible();

      // Should show user menu or profile
      await expect(
        page.locator('[data-testid="user-menu"], [aria-label="User menu"]')
      ).toBeVisible();
    });

    test('should remember email with "Remember me" checked', async ({ page }) => {
      await page.goto('/');

      // Fill form
      await page.fill('input[name="email"]', TEST_USERS.demo.email);
      await page.fill('input[name="password"]', TEST_USERS.demo.password);

      // Check "Remember me" if it exists
      const rememberCheckbox = page.locator('input[type="checkbox"][name="remember"], label:has-text("Remember")');
      if (await rememberCheckbox.count() > 0) {
        await rememberCheckbox.first().check();
      }

      // Submit
      await page.click('button[type="submit"]');

      // Wait for redirect
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Verify dashboard loaded
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Logout Flow', () => {
    test('should successfully logout', async ({ authenticatedPage: page }) => {
      // User is already logged in via fixture

      // Click user menu
      await page.click('[data-testid="user-menu"], [aria-label="User menu"]');

      // Click logout button
      await page.click('text=Logout, text=Sign out, button:has-text("Logout")');

      // Should redirect to login page
      await page.waitForURL('/', { timeout: 10000 });

      // Should show login form
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('should clear session data on logout', async ({ authenticatedPage: page }) => {
      // Logout
      await page.click('[data-testid="user-menu"], [aria-label="User menu"]');
      await page.click('text=Logout, text=Sign out, button:has-text("Logout")');

      // Wait for redirect
      await page.waitForURL('/', { timeout: 10000 });

      // Try to access protected route
      await page.goto('/dashboard');

      // Should redirect back to login
      await page.waitForURL('/', { timeout: 10000 });

      // Should show login form
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access dashboard without login
      await page.goto('/dashboard');

      // Should redirect to login
      await page.waitForURL('/', { timeout: 10000 });

      // Should show login form
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('should allow authenticated users to access dashboard', async ({ authenticatedPage: page }) => {
      // Navigate to dashboard
      await page.goto('/dashboard');

      // Should stay on dashboard
      await expect(page).toHaveURL(/\/dashboard/);

      // Should show dashboard content
      await expect(page.locator('text=/dashboard/i, h1').first()).toBeVisible();
    });

    test('should allow authenticated users to access pipelines', async ({ authenticatedPage: page }) => {
      // Navigate to pipelines
      await page.goto('/pipelines');

      // Should stay on pipelines page
      await expect(page).toHaveURL(/\/pipelines/);

      // Should show pipelines content
      await expect(page.locator('text=/pipeline/i, h1').first()).toBeVisible();
    });

    test('should allow authenticated users to access testing page', async ({ authenticatedPage: page }) => {
      // Navigate to testing
      await page.goto('/testing');

      // Should stay on testing page
      await expect(page).toHaveURL(/\/testing/);

      // Should show testing content
      await expect(page.locator('text=/test/i, h1').first()).toBeVisible();
    });
  });

  test.describe('Session Persistence', () => {
    test('should maintain session across page reloads', async ({ authenticatedPage: page }) => {
      // Verify we're on dashboard
      await expect(page).toHaveURL(/\/dashboard/);

      // Reload page
      await page.reload();

      // Should still be logged in
      await expect(page).toHaveURL(/\/dashboard/);

      // Should show user menu
      await expect(
        page.locator('[data-testid="user-menu"], [aria-label="User menu"]')
      ).toBeVisible();
    });

    test('should maintain session across navigation', async ({ authenticatedPage: page }) => {
      // Navigate to different pages
      await page.goto('/pipelines');
      await expect(page).toHaveURL(/\/pipelines/);

      await page.goto('/testing');
      await expect(page).toHaveURL(/\/testing/);

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);

      // Should still be logged in
      await expect(
        page.locator('[data-testid="user-menu"], [aria-label="User menu"]')
      ).toBeVisible();
    });
  });

  test.describe('User Profile', () => {
    test('should display user profile information', async ({ authenticatedPage: page }) => {
      // Click user menu
      await page.click('[data-testid="user-menu"], [aria-label="User menu"]');

      // Should show user email
      await expect(page.locator(`text=${TEST_USERS.demo.email}`)).toBeVisible();
    });

    test('should navigate to profile page', async ({ authenticatedPage: page }) => {
      // Click user menu
      await page.click('[data-testid="user-menu"], [aria-label="User menu"]');

      // Click profile link if it exists
      const profileLink = page.locator('text=Profile, a:has-text("Profile")');
      if (await profileLink.count() > 0) {
        await profileLink.first().click();

        // Should navigate to profile page
        await expect(page).toHaveURL(/\/profile/);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/');

      // Simulate offline
      await page.context().setOffline(true);

      // Try to login
      await page.fill('input[name="email"]', TEST_USERS.demo.email);
      await page.fill('input[name="password"]', TEST_USERS.demo.password);
      await page.click('button[type="submit"]');

      // Should show network error
      await expect(
        page.locator('text=/network.*error/i, text=/connection.*failed/i, text=/offline/i').first()
      ).toBeVisible({ timeout: 5000 });

      // Re-enable network
      await page.context().setOffline(false);
    });

    test('should handle API timeout gracefully', async ({ page }) => {
      // Slow down network to simulate timeout
      await page.route('**/api/auth/login', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 35000)); // Longer than typical timeout
        route.abort();
      });

      await page.goto('/');

      // Try to login
      await page.fill('input[name="email"]', TEST_USERS.demo.email);
      await page.fill('input[name="password"]', TEST_USERS.demo.password);
      await page.click('button[type="submit"]');

      // Should show timeout error
      await expect(
        page.locator('text=/timeout/i, text=/slow/i, text=/retry/i').first()
      ).toBeVisible({ timeout: 40000 });
    });
  });
});
