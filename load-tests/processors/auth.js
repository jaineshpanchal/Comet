/**
 * Artillery Processor Functions
 * Custom functions for load testing authentication and validation
 */

module.exports = {
  /**
   * Validate rate limit headers are present
   */
  validateRateLimitHeaders: function(requestParams, response, context, ee, next) {
    const headers = response.headers;

    if (headers['x-ratelimit-limit']) {
      ee.emit('counter', 'rate_limit.headers_present', 1);
    } else {
      ee.emit('counter', 'rate_limit.headers_missing', 1);
    }

    if (response.statusCode === 429) {
      ee.emit('counter', 'rate_limit.exceeded', 1);

      // Verify Retry-After header is present
      if (headers['retry-after']) {
        ee.emit('counter', 'rate_limit.retry_after_present', 1);
      }
    }

    return next();
  },

  /**
   * Login and capture token
   */
  loginUser: function(requestParams, context, ee, next) {
    const credentials = {
      email: context.vars.userEmail || 'demo@golive.dev',
      password: context.vars.userPassword || 'password123'
    };

    requestParams.json = credentials;
    return next();
  },

  /**
   * Process login response
   */
  processLoginResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 200 && response.body) {
      try {
        const data = JSON.parse(response.body);

        if (data.data && data.data.accessToken) {
          context.vars.accessToken = data.data.accessToken;
          context.vars.refreshToken = data.data.refreshToken;
          ee.emit('counter', 'auth.login_success', 1);
        } else {
          ee.emit('counter', 'auth.login_failed', 1);
        }
      } catch (error) {
        ee.emit('counter', 'auth.parse_error', 1);
      }
    } else if (response.statusCode === 429) {
      ee.emit('counter', 'auth.rate_limited', 1);
    } else {
      ee.emit('counter', 'auth.login_error', 1);
    }

    return next();
  },

  /**
   * Set authorization header
   */
  setAuthHeader: function(requestParams, context, ee, next) {
    if (context.vars.accessToken) {
      requestParams.headers = requestParams.headers || {};
      requestParams.headers.Authorization = `Bearer ${context.vars.accessToken}`;
      ee.emit('counter', 'auth.authenticated_request', 1);
    } else {
      ee.emit('counter', 'auth.unauthenticated_request', 1);
    }

    return next();
  },

  /**
   * Generate random test data
   */
  generateTestData: function(context, events, done) {
    context.vars.randomEmail = `test${Math.floor(Math.random() * 100000)}@example.com`;
    context.vars.randomName = `TestPipeline${Math.floor(Math.random() * 1000)}`;
    context.vars.randomId = Math.random().toString(36).substring(7);
    return done();
  },

  /**
   * Measure custom metrics
   */
  measureMetric: function(requestParams, response, context, ee, next) {
    const responseTime = response.timings.phases.total;

    // Track response time buckets
    if (responseTime < 100) {
      ee.emit('counter', 'response_time.under_100ms', 1);
    } else if (responseTime < 500) {
      ee.emit('counter', 'response_time.100_500ms', 1);
    } else if (responseTime < 1000) {
      ee.emit('counter', 'response_time.500_1000ms', 1);
    } else {
      ee.emit('counter', 'response_time.over_1000ms', 1);
    }

    // Track status code buckets
    const statusCode = response.statusCode;
    if (statusCode >= 200 && statusCode < 300) {
      ee.emit('counter', 'status.2xx', 1);
    } else if (statusCode >= 400 && statusCode < 500) {
      ee.emit('counter', 'status.4xx', 1);
    } else if (statusCode >= 500) {
      ee.emit('counter', 'status.5xx', 1);
    }

    return next();
  }
};
