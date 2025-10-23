import { test as base, Page } from '@playwright/test';

/**
 * Authentication fixtures for E2E tests
 * Provides authenticated and unauthenticated contexts
 */

export type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

/**
 * Test credentials (matching demo mode)
 */
export const TEST_USERS = {
  demo: {
    email: 'demo@golive.dev',
    password: 'password123',
    role: 'DEVELOPER',
  },
  admin: {
    email: 'admin@golive.dev',
    password: 'admin123',
    role: 'ADMIN',
  },
};

/**
 * Login helper function
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/');

  // Wait for login page
  await page.waitForURL('/');

  // Fill login form
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for successful login (redirect to dashboard)
  await page.waitForURL('/dashboard', { timeout: 10000 });

  // Verify we're logged in by checking for logout button or user menu
  await page.waitForSelector('[data-testid="user-menu"], [aria-label="User menu"]', {
    timeout: 5000,
  });
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Click user menu
  await page.click('[data-testid="user-menu"], [aria-label="User menu"]');

  // Click logout
  await page.click('text=Logout, text=Sign out');

  // Wait for redirect to login
  await page.waitForURL('/');
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  // Fixture for authenticated user (demo)
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await login(page, TEST_USERS.demo.email, TEST_USERS.demo.password);

    await use(page);

    await context.close();
  },

  // Fixture for admin user
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await use(page);

    await context.close();
  },
});

export { expect } from '@playwright/test';
