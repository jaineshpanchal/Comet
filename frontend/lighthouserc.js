module.exports = {
  ci: {
    collect: {
      // URLs to audit - add more as needed
      url: [
        'http://localhost:3030',
        'http://localhost:3030/dashboard',
        'http://localhost:3030/pipelines',
        'http://localhost:3030/testing',
        'http://localhost:3030/deployments',
      ],
      // Number of runs per URL for more stable results
      numberOfRuns: 3,
      // Headless Chrome settings
      settings: {
        // Use mobile emulation for mobile scores
        preset: 'desktop',
        // Skip service worker check for local development
        skipAudits: ['service-worker', 'installable-manifest'],
        // Emulate slower network for realistic testing
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    },
    assert: {
      // Assertions for performance budgets
      assertions: {
        // Categories - Core Web Vitals
        'categories:performance': ['error', { minScore: 0.8 }],  // 80+ performance score
        'categories:accessibility': ['error', { minScore: 0.9 }], // 90+ accessibility
        'categories:best-practices': ['error', { minScore: 0.85 }], // 85+ best practices
        'categories:seo': ['error', { minScore: 0.9 }], // 90+ SEO score

        // Performance Metrics - Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // 2s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s (good)
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1 (good)
        'total-blocking-time': ['warn', { maxNumericValue: 300 }], // 300ms
        'interactive': ['warn', { maxNumericValue: 3500 }], // 3.5s
        'speed-index': ['warn', { maxNumericValue: 3400 }], // 3.4s

        // Resource sizes
        'resource-summary:script:size': ['warn', { maxNumericValue: 350000 }], // 350KB JS
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 100000 }], // 100KB CSS
        'resource-summary:image:size': ['warn', { maxNumericValue: 500000 }], // 500KB images
        'resource-summary:total:size': ['warn', { maxNumericValue: 2000000 }], // 2MB total

        // Modern best practices
        'modern-image-formats': ['warn', { minScore: 0.8 }],
        'uses-optimized-images': ['warn', { minScore: 0.8 }],
        'uses-responsive-images': ['warn', { minScore: 0.8 }],
        'uses-webp-images': ['warn', { minScore: 0.8 }],

        // JavaScript performance
        'unused-javascript': ['warn', { maxNumericValue: 50000 }], // 50KB max unused
        'legacy-javascript': ['warn', { minScore: 0.9 }],
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }], // 4s
        'bootup-time': ['warn', { maxNumericValue: 3500 }], // 3.5s

        // Network performance
        'uses-http2': ['warn', { minScore: 0.8 }],
        'uses-long-cache-ttl': ['warn', { minScore: 0.7 }],
        'uses-text-compression': ['error', { minScore: 0.9 }],

        // Accessibility - Critical
        'color-contrast': ['error', { minScore: 1 }],
        'document-title': ['error', { minScore: 1 }],
        'html-has-lang': ['error', { minScore: 1 }],
        'meta-viewport': ['error', { minScore: 1 }],
        'aria-allowed-attr': ['error', { minScore: 1 }],
        'aria-required-attr': ['error', { minScore: 1 }],
        'aria-valid-attr': ['error', { minScore: 1 }],
        'button-name': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        'link-name': ['error', { minScore: 1 }],

        // SEO
        'meta-description': ['warn', { minScore: 1 }],
        'robots-txt': ['warn', { minScore: 1 }],
        'canonical': ['warn', { minScore: 1 }],
      },
    },
    upload: {
      // Upload results to temporary public storage (optional)
      target: 'temporary-public-storage',
    },
    server: {
      // Local server for viewing reports
      port: 9001,
    },
  },
};
