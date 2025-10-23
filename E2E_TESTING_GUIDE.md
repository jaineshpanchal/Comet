# E2E Testing Guide - GoLive Platform

## Overview

This guide covers end-to-end (E2E) testing for the GoLive Platform using Playwright. Our E2E test suite ensures critical user journeys work correctly across all browsers.

## Test Coverage

### Authentication (auth.spec.ts)
- ✅ Login flow with validation
- ✅ Logout flow and session clearing
- ✅ Protected routes access control
- ✅ Session persistence across reloads
- ✅ User profile display
- ✅ Error handling (network, timeout)

### Dashboard (dashboard.spec.ts)
- ✅ Page load and metrics display
- ✅ Navigation between pages
- ✅ Real-time WebSocket updates
- ✅ Responsive design (mobile/tablet)
- ✅ Data loading states
- ✅ Error handling and retry
- ✅ Accessibility (keyboard, ARIA)

### Pipelines (pipelines.spec.ts)
- ✅ Pipelines list display
- ✅ Pipeline creation workflow
- ✅ Pipeline details view
- ✅ Pipeline execution
- ✅ Filtering and search
- ✅ Real-time status updates
- ✅ Error handling

## Running Tests

### Prerequisites

```bash
# Install Playwright browsers (first time only)
cd frontend
npm run playwright:install
```

### Run All Tests

```bash
cd frontend

# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### Run Specific Browser

```bash
# Chrome only
npm run test:e2e:chromium

# Firefox only
npm run test:e2e:firefox

# Safari (WebKit) only
npm run test:e2e:webkit
```

### Run Specific Test File

```bash
# Run only authentication tests
npx playwright test e2e/auth.spec.ts

# Run only dashboard tests
npx playwright test e2e/dashboard.spec.ts

# Run only pipelines tests
npx playwright test e2e/pipelines.spec.ts
```

### Run Specific Test

```bash
# Run a specific test by grep
npx playwright test --grep "should successfully login"

# Run tests matching a pattern
npx playwright test --grep "authentication"
```

## Test Reports

### HTML Report

After tests complete, view the HTML report:

```bash
npm run test:e2e:report
```

The report will open in your browser at `http://localhost:9323`

### Report Contents

- Test results summary
- Screenshots of failures
- Videos of failed tests
- Traces for debugging
- Execution timeline

## Writing New Tests

### Test Structure

```typescript
import { test, expect } from './fixtures/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    // Setup code that runs before each test
    await page.goto('/your-page');
  });

  test('should do something', async ({ authenticatedPage: page }) => {
    // Test code
    await page.click('button');
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Using Fixtures

We provide custom fixtures for authenticated contexts:

```typescript
// Unauthenticated user
test('public test', async ({ page }) => {
  await page.goto('/');
});

// Authenticated demo user
test('user test', async ({ authenticatedPage: page }) => {
  // User is already logged in
  await page.goto('/dashboard');
});

// Admin user
test('admin test', async ({ adminPage: page }) => {
  // Admin is already logged in
  await page.goto('/admin');
});
```

### Best Practices

#### 1. Use Data Test IDs

```typescript
// Good - Stable selector
await page.click('[data-testid="submit-button"]');

// Avoid - Fragile selector
await page.click('button.btn.btn-primary.submit');
```

#### 2. Wait for Elements

```typescript
// Wait for element to be visible
await expect(page.locator('text=Success')).toBeVisible();

// Wait for URL change
await page.waitForURL('/dashboard');

// Wait for network idle
await page.waitForLoadState('networkidle');
```

#### 3. Handle Async Operations

```typescript
// Wait for API call to complete
await page.waitForResponse((response) =>
  response.url().includes('/api/pipelines') && response.status() === 200
);

// Wait for element with timeout
await page.locator('text=Success').waitFor({ timeout: 5000 });
```

#### 4. Clean Test Data

```typescript
test.afterEach(async ({ page }) => {
  // Clean up test data
  await page.request.delete('/api/test-data');
});
```

#### 5. Mock API Responses

```typescript
test('should handle error', async ({ page }) => {
  // Mock API error
  await page.route('**/api/pipelines', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ success: false, error: 'Server error' }),
    });
  });

  await page.goto('/pipelines');
  await expect(page.locator('text=Error')).toBeVisible();
});
```

## Debugging Tests

### Visual Debugging

```bash
# Run in UI mode - best for debugging
npm run test:e2e:ui

# Run in headed mode - see the browser
npm run test:e2e:headed

# Debug mode - step through tests
npm run test:e2e:debug
```

### Using Playwright Inspector

```bash
# Pause test execution
npx playwright test --debug

# Pause at specific line in code
await page.pause();
```

### View Traces

```bash
# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Console Logs

```typescript
// Listen to console messages
page.on('console', (msg) => console.log('Browser log:', msg.text()));

// Listen to page errors
page.on('pageerror', (error) => console.log('Page error:', error));
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start services
        run: |
          npm run dev:backend &
          npm run dev:frontend &
          sleep 10

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

### Environment Variables

```bash
# Set base URL for tests
export BASE_URL=https://staging.golive.dev
npx playwright test

# Run in CI mode
export CI=true
npx playwright test
```

## Test Configuration

### Playwright Config (playwright.config.ts)

Key settings:

- **Browsers**: Chrome, Firefox, Safari
- **Parallel**: Tests run in parallel
- **Retries**: 2 retries in CI, 0 locally
- **Timeout**: 30s per test
- **Screenshots**: On failure only
- **Video**: On first retry
- **Trace**: On first retry

### Customize Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  // Run tests in files in parallel
  fullyParallel: true,

  // Fail fast - stop after first failure
  maxFailures: 1,

  // Global timeout
  globalTimeout: 60 * 60 * 1000,

  // Update snapshots
  updateSnapshots: 'missing',
});
```

## Common Patterns

### Login Helper

```typescript
import { login } from './fixtures/auth';

test('custom login', async ({ page }) => {
  await login(page, 'user@example.com', 'password');
  await expect(page).toHaveURL('/dashboard');
});
```

### Waiting for Network

```typescript
// Wait for specific API call
const responsePromise = page.waitForResponse(
  (response) => response.url().includes('/api/pipelines')
);
await page.click('button');
const response = await responsePromise;
expect(response.status()).toBe(200);
```

### File Uploads

```typescript
// Upload file
await page.setInputFiles('input[type="file"]', '/path/to/file.txt');

// Upload multiple files
await page.setInputFiles('input[type="file"]', [
  '/path/to/file1.txt',
  '/path/to/file2.txt',
]);
```

### Downloads

```typescript
// Wait for download
const downloadPromise = page.waitForEvent('download');
await page.click('a[download]');
const download = await downloadPromise;

// Save download
await download.saveAs('/path/to/save/file.txt');
```

### Multiple Tabs

```typescript
// Open new tab
const [newPage] = await Promise.all([
  page.context().waitForEvent('page'),
  page.click('a[target="_blank"]'),
]);

// Work with new tab
await newPage.waitForLoadState();
await expect(newPage).toHaveURL(/new-page/);
```

## Troubleshooting

### Tests Failing Locally

1. **Ensure services are running**:
   ```bash
   # Check if backend is running
   curl http://localhost:8000/api/health

   # Check if frontend is running
   curl http://localhost:3030
   ```

2. **Clear browser data**:
   ```bash
   npx playwright clean
   ```

3. **Update browsers**:
   ```bash
   npm run playwright:install
   ```

### Flaky Tests

1. **Add explicit waits**:
   ```typescript
   await page.waitForLoadState('networkidle');
   await expect(element).toBeVisible({ timeout: 10000 });
   ```

2. **Disable animations**:
   ```typescript
   await page.addStyleTag({
     content: '* { transition: none !important; animation: none !important; }',
   });
   ```

3. **Increase timeout**:
   ```typescript
   test('slow test', { timeout: 60000 }, async ({ page }) => {
     // Test code
   });
   ```

### Selector Not Found

1. **Use Playwright Inspector**:
   ```bash
   npx playwright test --debug
   ```

2. **Try different selectors**:
   ```typescript
   // Text content
   page.locator('text=Submit');

   // Test ID
   page.locator('[data-testid="submit"]');

   // CSS selector
   page.locator('button.submit');

   // XPath
   page.locator('xpath=//button[text()="Submit"]');
   ```

## Performance Tips

### Run Tests in Parallel

```bash
# Run with 4 workers
npx playwright test --workers=4

# Run in serial
npx playwright test --workers=1
```

### Skip Slow Tests in Development

```typescript
test.skip('slow test', async ({ page }) => {
  // This test will be skipped
});

test('fast test', async ({ page }) => {
  // This test will run
});
```

### Use Test Groups

```typescript
test.describe.parallel('API Tests', () => {
  // These tests run in parallel
  test('test 1', async ({ page }) => {});
  test('test 2', async ({ page }) => {});
});

test.describe.serial('Sequential Tests', () => {
  // These tests run one after another
  test('test 1', async ({ page }) => {});
  test('test 2', async ({ page }) => {});
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

**Last Updated**: October 23, 2025
**Playwright Version**: 1.40+
**Test Coverage**: Authentication, Dashboard, Pipelines
