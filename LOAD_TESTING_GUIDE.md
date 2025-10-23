# Load Testing Guide - GoLive Platform

## Overview

Comprehensive load testing suite using Artillery for the GoLive DevOps Platform. This guide covers performance testing, stress testing, and capacity planning.

## Quick Start

```bash
cd load-tests

# Quick smoke test (500 requests)
npm run test:quick

# Health check load test (5-minute test)
npm run test:health

# Rate limiting stress test
npm run test:rate-limit

# Authenticated user journey
npm run test:journey

# Run all tests
npm run test:all
```

## Test Scenarios

### 1. Baseline Health Check (`baseline-health-check.yml`)

**Purpose**: Establish performance baselines for health endpoints

**Load Profile**:
- Warm-up: 30s @ 5 req/sec
- Ramp-up: 60s @ 10-50 req/sec
- Sustained: 120s @ 50 req/sec
- Peak: 60s @ 100 req/sec
- Cool-down: 30s @ 10 req/sec

**Total Duration**: ~5 minutes
**Endpoints Tested**:
- `GET /api/health`
- `GET /api/health/detailed`
- `GET /api/health/services/api-gateway`

**Run**:
```bash
npm run test:health
```

**Expected Results**:
- ✅ Response time < 10ms (p95)
- ✅ 100% success rate
- ✅ No errors or timeouts

---

### 2. Rate Limiting Stress Test (`rate-limit-stress-test.yml`)

**Purpose**: Validate rate limiting system under stress

**Load Profile**:
- Phase 1: 30s @ 20 req/sec (under limit)
- Phase 2: 30s @ 50 req/sec (approaching limit)
- Phase 3: 30s @ 150 req/sec (over limit)
- Phase 4: 30s @ 300 req/sec (way over limit)

**Total Duration**: 2 minutes
**Endpoints Tested**:
- `GET /api/health` (public)
- `POST /api/auth/login` (auth - strict limits)
- `GET /api/metrics/dashboard` (API endpoints)
- `GET /api/pipelines` (protected)

**Run**:
```bash
npm run test:rate-limit
```

**Expected Results**:
- ✅ Rate limit headers present (X-RateLimit-*)
- ✅ 429 responses when limit exceeded
- ✅ Retry-After header in 429 responses
- ✅ Rate limiting kicks in correctly

**Metrics to Monitor**:
- `rate_limit.headers_present` - Rate limit headers sent
- `rate_limit.exceeded` - Number of 429 responses
- `rate_limit.retry_after_present` - Retry-After header sent
- `auth.rate_limited` - Auth endpoint rate limited

---

### 3. Authenticated User Journey (`auth-user-journey.yml`)

**Purpose**: Realistic user workflow simulation

**Load Profile**:
- Light: 60s @ 5 users/sec
- Normal: 120s @ 20 users/sec
- Peak: 60s @ 50 users/sec

**Total Duration**: 4 minutes
**User Flow**:
1. Login (`POST /api/auth/login`)
2. Get profile (`GET /api/auth/profile`)
3. View dashboard (`GET /api/metrics/dashboard`)
4. View pipelines (`GET /api/pipelines`)
5. View tests (`GET /api/tests`)
6. View deployments (`GET /api/deployments`)
7. View pipeline metrics (`GET /api/metrics/pipelines`)
8. View activities (`GET /api/metrics/activities`)

**Run**:
```bash
npm run test:journey
```

**Expected Results**:
- ✅ Successful login and token capture
- ✅ Authenticated requests work
- ✅ Response times < 100ms (p95)
- ✅ No auth errors (except rate limiting)

**Metrics to Monitor**:
- `auth.login_success` - Successful logins
- `auth.login_failed` - Failed logins
- `auth.authenticated_request` - Requests with valid token
- `response_time.under_100ms` - Fast responses

---

## Understanding Results

### Key Metrics

#### HTTP Metrics
```
http.codes.200: 500          # Successful responses
http.response_time:
  min: 0                     # Fastest response
  max: 7                     # Slowest response
  mean: 0.7                  # Average response time
  median: 1                  # 50th percentile
  p95: 1                     # 95th percentile
  p99: 3                     # 99th percentile
http.request_rate: 500/sec   # Requests per second
```

#### Virtual Users
```
vusers.created: 10           # Users started
vusers.completed: 10         # Users finished
vusers.failed: 0             # Users that errored
vusers.session_length:       # Time per user session
  mean: 60.9                 # Average session duration
```

### Performance Baselines

Based on our quick test results:

| Metric | Value | Status |
|--------|-------|--------|
| Mean Response Time | 0.7ms | ⚡ Excellent |
| P95 Response Time | 1ms | ⚡ Excellent |
| P99 Response Time | 3ms | ⚡ Excellent |
| Success Rate | 100% | ✅ Perfect |
| Max Throughput | 500 req/sec | ✅ Strong |

**Interpretation**:
- **< 10ms**: Excellent performance
- **10-50ms**: Good performance
- **50-100ms**: Acceptable performance
- **> 100ms**: Needs optimization

### Response Time Buckets

Custom metrics track response time distribution:

```
response_time.under_100ms: 450    # 90% of requests
response_time.100_500ms: 45       # 9% of requests
response_time.500_1000ms: 4       # 0.8% of requests
response_time.over_1000ms: 1      # 0.2% of requests
```

### Status Code Distribution

```
status.2xx: 485               # Successful requests (97%)
status.4xx: 15                # Client errors (3%)
status.5xx: 0                 # Server errors (0%)
```

---

## Custom Processor Functions

Located in `processors/auth.js`:

### Authentication Functions

```javascript
loginUser()              // Prepare login request
processLoginResponse()   // Extract token from response
setAuthHeader()          // Add Bearer token to request
generateTestData()       // Create random test data
```

### Validation Functions

```javascript
validateRateLimitHeaders()  // Check rate limit headers
measureMetric()             // Track custom metrics
```

### Custom Metrics Emitted

- `rate_limit.headers_present` - Rate limit headers detected
- `rate_limit.exceeded` - 429 responses received
- `auth.login_success` - Successful authentication
- `auth.authenticated_request` - Requests with token
- `response_time.under_100ms` - Fast response bucket
- `status.2xx` - Success responses

---

## Advanced Usage

### Custom Load Profiles

Create your own test scenario:

```yaml
config:
  target: "http://localhost:8000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Ramp-up"

scenarios:
  - name: "My Test"
    flow:
      - get:
          url: "/api/endpoint"
          expect:
            - statusCode: 200
```

### Environment Variables

```bash
# Target different environments
TARGET_URL=https://staging.golive.dev npm run test:health

# Override test duration
DURATION=300 npm run test:health
```

### HTML Reports

Generate HTML report:

```bash
artillery run scenarios/baseline-health-check.yml --output report.json
artillery report report.json
```

Open `report.json.html` in your browser.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd load-tests
          npm ci

      - name: Start services
        run: |
          docker-compose up -d
          sleep 10

      - name: Run load tests
        run: |
          cd load-tests
          npm run test:all

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: load-tests/*.log
```

---

## Performance Tuning

### If Response Times Are High

1. **Check Database**:
   ```bash
   # Check slow queries
   SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
   ```

2. **Check Redis**:
   ```bash
   redis-cli INFO stats
   redis-cli SLOWLOG GET 10
   ```

3. **Check Node.js**:
   - Enable profiling
   - Check CPU usage
   - Monitor memory leaks

### If Error Rate Is High

1. **Check Logs**:
   ```bash
   tail -f backend/api-gateway/logs/error.log
   ```

2. **Check Rate Limiting**:
   - Are limits too strict?
   - Check Redis keys: `redis-cli KEYS "ratelimit:*"`

3. **Check Database Connections**:
   - Connection pool size
   - Max connections reached

---

## Troubleshooting

### Test Hangs or Times Out

```bash
# Check if backend is running
curl http://localhost:8000/api/health

# Check connectivity
telnet localhost 8000

# Increase timeout in scenario
config:
  timeout: 30  # seconds
```

### High Error Rate

```bash
# Check backend logs
docker logs golive-api-gateway

# Check system resources
docker stats

# Reduce load
# Edit scenario to reduce arrivalRate
```

### Memory Leaks

```bash
# Monitor memory during test
watch -n 1 'docker stats --no-stream'

# Profile with Artillery
artillery run --overrides.config.processor ./profile.js scenario.yml
```

---

## Best Practices

### 1. Start Small
Always start with light load and gradually increase:
```yaml
phases:
  - duration: 60
    arrivalRate: 1     # Start with 1 user/sec
  - duration: 60
    arrivalRate: 10    # Then 10
  - duration: 60
    arrivalRate: 100   # Then 100
```

### 2. Think Time
Add realistic delays between requests:
```yaml
- think: 5  # Wait 5 seconds
```

### 3. Clean Test Data
Reset database between test runs:
```bash
npm run db:reset
npm run test:journey
```

### 4. Monitor Resources
Track system metrics during tests:
```bash
# CPU, Memory, Network
htop
docker stats
```

### 5. Test in Production-Like Environment
- Same infrastructure
- Same database size
- Same network conditions

---

## Interpreting Results for Production

### Capacity Planning

Based on test results, calculate capacity:

```
Max Safe Load = (Peak Throughput × 0.7)
```

Example:
- Peak throughput: 500 req/sec
- Safety margin: 70%
- **Max safe load: 350 req/sec**

### Scaling Recommendations

| Current Load | Action |
|--------------|--------|
| < 50% capacity | ✅ No action needed |
| 50-70% capacity | ⚠️ Plan to scale |
| 70-90% capacity | 🚨 Scale soon |
| > 90% capacity | 🔴 Scale immediately |

### SLA Targets

Set performance SLAs based on test results:

- **P95 < 50ms**: Excellent UX
- **P99 < 100ms**: Good UX
- **Success rate > 99.9%**: Three nines
- **Success rate > 99.99%**: Four nines

---

## Quick Reference

### Test Commands

```bash
# Quick smoke test
npm run test:quick

# Full test suite
npm run test:all

# Individual tests
npm run test:health
npm run test:rate-limit
npm run test:journey

# Custom scenario
artillery run my-scenario.yml

# With HTML report
artillery run scenario.yml --output results.json
artillery report results.json
```

### Common Scenarios

```bash
# Test rate limiting
npm run test:rate-limit

# Test authentication
npm run test:journey

# Stress test
artillery quick --count 100 --num 1000 http://localhost:8000/api/health

# Spike test
artillery quick --count 1 --num 10000 http://localhost:8000/api/health
```

---

## Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [Performance Testing Best Practices](https://www.artillery.io/docs/guides/guides/best-practices)
- [Artillery Examples](https://github.com/artilleryio/artillery-examples)

---

**Last Updated**: October 23, 2025
**Artillery Version**: 2.0+
**Test Scenarios**: 3 (Health, Rate Limiting, User Journey)
**Baseline Performance**: 500 req/sec @ 0.7ms mean response time

