# Lighthouse CI Performance Monitoring Guide

## Table of Contents
- [Overview](#overview)
- [Baseline Performance Metrics](#baseline-performance-metrics)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [CI/CD Integration](#cicd-integration)
- [Performance Budgets](#performance-budgets)
- [Interpreting Results](#interpreting-results)
- [Optimization Recommendations](#optimization-recommendations)
- [Troubleshooting](#troubleshooting)

---

## Overview

Lighthouse CI is an automated performance monitoring tool that runs Google Lighthouse audits on every commit and pull request. It helps maintain performance standards by failing builds that don't meet predefined performance budgets.

### Why Lighthouse CI?

- **Automated Performance Monitoring** - Catches performance regressions before they reach production
- **Core Web Vitals Tracking** - Monitors LCP, FID, CLS, FCP, and TTI
- **Performance Budgets** - Enforces size and speed limits for JavaScript, CSS, images
- **Accessibility Audits** - Ensures WCAG compliance
- **SEO Best Practices** - Validates meta tags, robots.txt, structured data
- **Historical Tracking** - Compare performance over time
- **PR Comments** - Automatic performance feedback on pull requests

### What Gets Audited?

1. **Performance** (Target: 80+)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Total Blocking Time (TBT)
   - Cumulative Layout Shift (CLS)
   - Speed Index (SI)

2. **Accessibility** (Target: 90+)
   - Color contrast
   - ARIA attributes
   - Form labels
   - Alt text for images

3. **Best Practices** (Target: 85+)
   - HTTPS usage
   - Console errors
   - Image aspect ratios
   - Deprecated APIs

4. **SEO** (Target: 90+)
   - Meta descriptions
   - Valid HTML lang
   - Mobile viewport
   - Crawlable links

---

## Baseline Performance Metrics

Initial Lighthouse audit results for the GoLive platform (Oct 23, 2025):

```
┌─────────────────────┬────────┬────────┐
│ Category            │ Score  │ Target │
├─────────────────────┼────────┼────────┤
│ Performance         │  80    │  80+   │ ✅
│ Accessibility       │  95    │  90+   │ ✅
│ Best Practices      │  96    │  85+   │ ✅
│ SEO                 │ 100    │  90+   │ ✅
└─────────────────────┴────────┴────────┘

Core Web Vitals:
┌─────────────────────────────────┬─────────┬──────────┐
│ Metric                          │ Value   │ Target   │
├─────────────────────────────────┼─────────┼──────────┤
│ First Contentful Paint (FCP)    │ 0.3s    │ < 2.0s   │ ✅
│ Largest Contentful Paint (LCP)  │ 2.1s    │ < 2.5s   │ ✅
│ Cumulative Layout Shift (CLS)   │ 0       │ < 0.1    │ ✅
│ Total Blocking Time (TBT)       │ 260ms   │ < 300ms  │ ✅
│ Speed Index (SI)                │ 0.8s    │ < 3.4s   │ ✅
└─────────────────────────────────┴─────────┴──────────┘
```

**Analysis:**
- Excellent scores across all categories
- Core Web Vitals all in "Good" range
- FCP and LCP are exceptionally fast
- Zero layout shift indicates stable visual loading
- TBT is low, indicating minimal JavaScript blocking

---

## Installation

Lighthouse CI is already installed in the `frontend/` directory:

```bash
cd frontend
npm install --save-dev @lhci/cli lighthouse
```

**Dependencies:**
- `@lhci/cli` - Lighthouse CI command-line interface
- `lighthouse` - Google Lighthouse auditing tool

---

## Configuration

### Configuration File: `frontend/lighthouserc.js`

The configuration file defines:

1. **URLs to Audit** - Which pages to test
2. **Performance Budgets** - Score and metric thresholds
3. **Assertions** - Pass/fail criteria
4. **Number of Runs** - Stability through multiple audits (default: 3)

Key settings:

```javascript
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3030',           // Landing page
        'http://localhost:3030/dashboard', // Dashboard
        'http://localhost:3030/pipelines', // Pipelines
        'http://localhost:3030/testing',   // Testing
        'http://localhost:3030/deployments', // Deployments
      ],
      numberOfRuns: 3,  // Run 3 times and take median
      settings: {
        preset: 'desktop',
        skipAudits: ['service-worker', 'installable-manifest'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        // ... more assertions
      },
    },
  },
};
```

### Modifying Configuration

**Add more URLs to audit:**
```javascript
url: [
  'http://localhost:3030',
  'http://localhost:3030/new-page', // Add here
],
```

**Adjust performance budgets:**
```javascript
assertions: {
  'largest-contentful-paint': ['error', { maxNumericValue: 3000 }], // 3s instead of 2.5s
  'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }], // 500KB JS
}
```

**Change severity levels:**
- `'error'` - Fails the build
- `'warn'` - Shows warning but doesn't fail
- `'off'` - Disables the assertion

---

## Running Locally

### Prerequisites

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

   Server must be running on `http://localhost:3030`

2. **Ensure backend is running** (if testing authenticated pages):
   ```bash
   cd backend/api-gateway
   npm run dev
   ```

### Commands

#### Full Audit (Recommended)
```bash
cd frontend
npm run lighthouse
```

Runs complete audit with all configured URLs and assertions.

#### Collect Reports Only
```bash
npm run lighthouse:collect
```

Collects Lighthouse data without running assertions. Useful for viewing reports without failing.

#### Run Assertions
```bash
npm run lighthouse:assert
```

Runs assertions on previously collected data.

#### Upload Results
```bash
npm run lighthouse:upload
```

Uploads results to temporary public storage (24h retention).

#### View Reports Locally
```bash
npm run lighthouse:server
```

Starts local server on port 9001 to view reports:
- Open: `http://localhost:9001`

#### Mobile vs Desktop
```bash
npm run lighthouse:mobile   # Mobile emulation
npm run lighthouse:desktop  # Desktop (default)
```

### Viewing Reports

After running Lighthouse, reports are saved to `frontend/.lighthouseci/`:

```
.lighthouseci/
├── lhr-1234567890.html   # Visual HTML report
└── lhr-1234567890.json   # Raw JSON data
```

**Open HTML report:**
```bash
open .lighthouseci/lhr-*.html
```

**Extract scores from JSON:**
```bash
cat .lighthouseci/lhr-*.json | jq '.categories | map_values(.score * 100)'
```

---

## CI/CD Integration

### GitHub Actions Workflow

The workflow runs automatically on:
- Pull requests to `master`/`main`
- Pushes to `master`/`main`
- Manual trigger via GitHub UI
- Weekly schedule (Sundays at 00:00 UTC)

**File:** `.github/workflows/lighthouse-ci.yml`

**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (root, frontend, backend)
4. Build frontend for production
5. Setup PostgreSQL and Redis
6. Run database migrations
7. Start backend server on port 8000
8. Start frontend server on port 3030
9. Wait for servers to be ready
10. Run Lighthouse CI audits
11. Upload reports as artifacts
12. Comment PR with scores (on PRs only)

### Viewing CI Results

**On Pull Requests:**
- Lighthouse CI posts a comment with scores
- Click the temporary public storage link to view full report
- Reports are available for 24 hours

**On GitHub Actions:**
1. Go to **Actions** tab
2. Click on **Lighthouse CI** workflow
3. View the run details
4. Download **lighthouse-reports** artifact (available for 30 days)

**Artifacts include:**
- HTML reports for all audited URLs
- JSON data for programmatic analysis
- Summary statistics

### Setting Up GitHub App Token (Optional)

For private repositories, you can set up a Lighthouse CI GitHub App token to store reports longer:

1. Go to https://github.com/apps/lighthouse-ci
2. Install the app on your repository
3. Generate a token
4. Add to repository secrets: `LHCI_GITHUB_APP_TOKEN`

---

## Performance Budgets

Performance budgets are defined in `lighthouserc.js` under `ci.assert.assertions`.

### Category Scores

```javascript
'categories:performance': ['error', { minScore: 0.8 }],     // 80+
'categories:accessibility': ['error', { minScore: 0.9 }],   // 90+
'categories:best-practices': ['error', { minScore: 0.85 }], // 85+
'categories:seo': ['error', { minScore: 0.9 }],             // 90+
```

### Core Web Vitals

```javascript
// First Contentful Paint
'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // 2s

// Largest Contentful Paint (most important for UX)
'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s

// Cumulative Layout Shift (visual stability)
'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1

// Total Blocking Time (interactivity)
'total-blocking-time': ['warn', { maxNumericValue: 300 }], // 300ms

// Speed Index
'speed-index': ['warn', { maxNumericValue: 3400 }], // 3.4s
```

### Resource Sizes

```javascript
'resource-summary:script:size': ['warn', { maxNumericValue: 350000 }],     // 350KB JS
'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 100000 }], // 100KB CSS
'resource-summary:image:size': ['warn', { maxNumericValue: 500000 }],      // 500KB images
'resource-summary:total:size': ['warn', { maxNumericValue: 2000000 }],     // 2MB total
```

### Accessibility

```javascript
'color-contrast': ['error', { minScore: 1 }],       // 100% pass
'image-alt': ['error', { minScore: 1 }],            // All images have alt text
'button-name': ['error', { minScore: 1 }],          // All buttons have names
'label': ['error', { minScore: 1 }],                // All inputs have labels
```

---

## Interpreting Results

### Understanding Scores

Lighthouse scores are weighted averages of individual audits:

- **0-49** (Red) - Poor, immediate action required
- **50-89** (Orange) - Needs improvement
- **90-100** (Green) - Good

### Core Web Vitals Thresholds

Google's official thresholds:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP    | ≤2.5s | 2.5s-4.0s | >4.0s |
| FID    | ≤100ms | 100ms-300ms | >300ms |
| CLS    | ≤0.1 | 0.1-0.25 | >0.25 |
| FCP    | ≤1.8s | 1.8s-3.0s | >3.0s |
| TTI    | ≤3.8s | 3.8s-7.3s | >7.3s |

### Common Issues and Fixes

#### Poor Performance Score

**Issue:** JavaScript bundle too large
```
unused-javascript: 120KB of unused JavaScript
```

**Fix:**
```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer

# Enable tree shaking
# Remove unused dependencies
# Use dynamic imports for large components
```

**Issue:** Images not optimized
```
uses-optimized-images: Images could save 500KB
```

**Fix:**
```javascript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/large-image.png"
  width={800}
  height={600}
  alt="Description"
/>
```

#### Low Accessibility Score

**Issue:** Missing alt text
```
image-alt: 5 images missing alt attributes
```

**Fix:**
```jsx
// Bad
<img src="/icon.png" />

// Good
<img src="/icon.png" alt="Dashboard icon" />
```

**Issue:** Poor color contrast
```
color-contrast: 3 elements have insufficient contrast
```

**Fix:**
```css
/* Bad - 3.1:1 contrast ratio */
color: #777;
background: #fff;

/* Good - 4.5:1 contrast ratio */
color: #595959;
background: #fff;
```

#### SEO Issues

**Issue:** Missing meta description
```
meta-description: Page is missing meta description
```

**Fix:**
```jsx
// Add to page component
export const metadata = {
  title: 'Dashboard - GoLive',
  description: 'Manage your CI/CD pipelines, deployments, and testing.',
};
```

---

## Optimization Recommendations

### Quick Wins

1. **Enable Text Compression**
   ```javascript
   // next.config.js
   module.exports = {
     compress: true, // Enable gzip compression
   };
   ```

2. **Optimize Images**
   - Use WebP format
   - Serve responsive images
   - Lazy load off-screen images
   ```jsx
   <Image
     src="/hero.jpg"
     loading="lazy"
     quality={85}
   />
   ```

3. **Defer Non-Critical JavaScript**
   ```jsx
   <Script
     src="/analytics.js"
     strategy="lazyOnload"
   />
   ```

4. **Preconnect to Required Origins**
   ```jsx
   <link rel="preconnect" href="https://api.golive.dev" />
   <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
   ```

### Advanced Optimizations

1. **Code Splitting**
   ```javascript
   // Dynamic imports for heavy components
   const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
     loading: () => <Spinner />,
   });
   ```

2. **Reduce JavaScript Execution Time**
   ```javascript
   // Use Web Workers for heavy computations
   const worker = new Worker('/worker.js');
   worker.postMessage({ data: largeDataset });
   ```

3. **Optimize Third-Party Scripts**
   ```javascript
   // Load third-party scripts efficiently
   useEffect(() => {
     if ('requestIdleCallback' in window) {
       requestIdleCallback(() => loadAnalytics());
     } else {
       setTimeout(() => loadAnalytics(), 2000);
     }
   }, []);
   ```

4. **Cache API Responses**
   ```javascript
   // SWR for client-side caching
   import useSWR from 'swr';

   const { data } = useSWR('/api/user', fetcher, {
     revalidateOnFocus: false,
     dedupingInterval: 60000, // 1 minute
   });
   ```

---

## Troubleshooting

### Lighthouse CI Fails to Connect

**Error:** `Error: Failed to fetch http://localhost:3030`

**Solution:**
1. Ensure dev server is running
   ```bash
   lsof -i :3030
   ```

2. Check server is accessible
   ```bash
   curl http://localhost:3030
   ```

3. Wait for server to be ready
   ```bash
   timeout 60 bash -c 'until curl -f http://localhost:3030; do sleep 2; done'
   ```

### Inconsistent Scores Between Runs

**Issue:** Scores vary significantly (±10 points)

**Solution:**
1. Increase number of runs (takes median)
   ```javascript
   numberOfRuns: 5, // Up from 3
   ```

2. Disable CPU throttling for local testing
   ```javascript
   settings: {
     throttling: {
       cpuSlowdownMultiplier: 1, // No throttling
     },
   },
   ```

3. Close background applications
4. Use production build, not dev server
   ```bash
   npm run build && npm run start
   ```

### Assertions Failing on CI but Passing Locally

**Issue:** GitHub Actions fails Lighthouse assertions

**Possible Causes:**
1. **Different build environment**
   - CI uses production build
   - Local uses dev build

   **Solution:** Test with production build locally
   ```bash
   npm run build
   npm run start
   npm run lighthouse
   ```

2. **Backend not running**
   - API calls fail, slowing page load

   **Solution:** Check workflow starts backend correctly

3. **Database not seeded**
   - Pages show loading spinners forever

   **Solution:** Add seed step to workflow

### Memory Issues on CI

**Error:** `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`

**Solution:**
```yaml
# In .github/workflows/lighthouse-ci.yml
- name: Run Lighthouse CI
  run: cd frontend && npx lhci autorun
  env:
    NODE_OPTIONS: "--max_old_space_size=4096"
```

### Viewing Reports on Failed Runs

Even if Lighthouse fails, reports are uploaded as artifacts:

1. Go to GitHub Actions
2. Click on failed run
3. Scroll to "Artifacts"
4. Download "lighthouse-reports"
5. Unzip and open HTML files

---

## Best Practices

### 1. Run Lighthouse Before Every Commit

Add to pre-commit hook:
```bash
# .husky/pre-commit
npm run lighthouse:collect
```

### 2. Monitor Trends Over Time

Track performance over time by:
- Saving JSON reports to S3/cloud storage
- Creating dashboard with historical data
- Setting up alerts for score drops

### 3. Test on Real Devices

Lighthouse emulates devices, but test on real devices too:
- Use BrowserStack/Sauce Labs
- Test on slow 3G connections
- Check on various screen sizes

### 4. Focus on User-Centric Metrics

Prioritize:
1. **Largest Contentful Paint (LCP)** - When main content loads
2. **Cumulative Layout Shift (CLS)** - Visual stability
3. **First Input Delay (FID)** - Interactivity

### 5. Set Realistic Budgets

Don't aim for 100 across all categories immediately:
- Start with 70+ performance
- Gradually increase to 80+, then 90+
- Balance performance with features

### 6. Audit Critical User Journeys

Test pages that matter most:
- Landing page (first impression)
- Dashboard (most visited)
- Checkout flow (business critical)
- Forms (user interaction)

---

## Additional Resources

### Official Documentation
- [Lighthouse CI Docs](https://github.com/GoogleChrome/lighthouse-ci)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [Core Web Vitals](https://web.dev/vitals/)

### Tools
- [PageSpeed Insights](https://pagespeed.web.dev/) - Google's web performance tool
- [WebPageTest](https://www.webpagetest.org/) - Detailed performance testing
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Built-in browser tools

### Next.js Performance
- [Next.js Analytics](https://nextjs.org/analytics)
- [Next.js Image Optimization](https://nextjs.org/docs/basic-features/image-optimization)
- [Next.js Font Optimization](https://nextjs.org/docs/basic-features/font-optimization)

---

## Support

For issues or questions:
1. Check [Lighthouse CI GitHub Issues](https://github.com/GoogleChrome/lighthouse-ci/issues)
2. Review [web.dev performance guides](https://web.dev/fast/)
3. Contact the GoLive DevOps team

---

**Last Updated:** October 23, 2025
**Maintained By:** GoLive Platform Team
