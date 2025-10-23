# Distributed Tracing with OpenTelemetry - Complete Guide

##Overview

OpenTelemetry distributed tracing provides end-to-end visibility across all microservices, helping you track requests as they flow through your entire system.

## What's Implemented

✅ **Automatic Instrumentation**: HTTP, Express, Prisma, PostgreSQL, Redis
✅ **Custom Spans**: Manual instrumentation for business logic
✅ **Multiple Exporters**: Jaeger, Zipkin, OTLP, Console
✅ **Trace Context Propagation**: Automatic across services
✅ **Performance Monitoring**: Track slow operations
✅ **Jaeger UI**: Visual trace exploration

## Quick Start

### 1. Start Jaeger

```bash
# Start Jaeger using Docker Compose
docker-compose -f docker-compose.tracing.yml up -d

# Verify Jaeger is running
curl http://localhost:16686
```

**Jaeger UI**: http://localhost:16686

### 2. Configure Environment

```bash
# backend/api-gateway/.env
OTEL_ENABLED=true
OTEL_SERVICE_NAME="golive-api-gateway"
OTEL_EXPORTER="jaeger"
JAEGER_ENDPOINT="http://localhost:14268/api/traces"
```

### 3. Start Backend

```bash
cd backend/api-gateway
npm run dev

# Look for:
# [Tracing] Initialized successfully
# [Tracing] Using Jaeger exporter
```

### 4. Generate Traces

```bash
# Make some API requests
curl http://localhost:8000/api/health
curl http://localhost:8000/api/v1/users
curl http://localhost:8000/api/v1/projects
```

### 5. View Traces in Jaeger

1. Open http://localhost:16686
2. Select service: `golive-api-gateway`
3. Click "Find Traces"
4. Click on a trace to see details

## Architecture

### Automatic Instrumentation

The following are automatically traced:

- **HTTP Requests**: All incoming/outgoing HTTP calls
- **Express Routes**: Route handlers and middleware
- **Database**: Prisma/PostgreSQL queries
- **Redis**: Cache operations
- **Service Calls**: Microservice communication

### Custom Instrumentation

Use custom spans for business logic:

```typescript
import { withSpan } from './config/tracing';

// Automatic span lifecycle management
const result = await withSpan('process-pipeline', async (span) => {
  span.setAttribute('pipelineId', pipeline.id);
  span.setAttribute('userId', user.id);

  // Your business logic
  await buildDockerImage();
  await deployToKubernetes();

  return { success: true };
});
```

## Usage Examples

### Example 1: Trace Database Operations

```typescript
import { traceDatabase } from './config/tracing';

const users = await traceDatabase(
  'query',
  'SELECT * FROM users WHERE active = true',
  async () => {
    return await prisma.user.findMany({ where: { isActive: true } });
  }
);
```

### Example 2: Trace HTTP Calls

```typescript
import { traceHttpCall } from './config/tracing';

const response = await traceHttpCall(
  'POST',
  'https://api.github.com/repos',
  async () => {
    return await fetch('https://api.github.com/repos', { method: 'POST' });
  }
);
```

### Example 3: Trace Service Calls

```typescript
import { traceServiceCall } from './config/tracing';

const result = await traceServiceCall(
  'pipeline-service',
  'execute',
  async () => {
    return await ServiceProxy.makeRequest('PIPELINE_SERVICE', {
      method: 'POST',
      endpoint: '/api/pipelines/execute'
    });
  }
);
```

### Example 4: Manual Span Creation

```typescript
import { createSpan, SpanStatusCode } from './config/tracing';

const span = createSpan('deploy-application', {
  'deployment.id': deploymentId,
  'deployment.env': 'production'
});

try {
  await deployApplication();
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  span.recordException(error);
  throw error;
} finally {
  span.end();
}
```

### Example 5: Add Attributes to Active Span

```typescript
import { addSpanAttributes, addSpanEvent } from './config/tracing';

// Add attributes
addSpanAttributes({
  'user.id': user.id,
  'user.role': user.role,
  'request.size': requestSize
});

// Add events
addSpanEvent('cache-hit', { key: 'user:123' });
addSpanEvent('db-query-started', { table: 'users' });
```

## Configuration

### Environment Variables

```bash
# Enable/disable tracing
OTEL_ENABLED=true

# Service name (appears in Jaeger UI)
OTEL_SERVICE_NAME="golive-api-gateway"

# Exporter: jaeger | zipkin | otlp | console
OTEL_EXPORTER="jaeger"

# Jaeger endpoint
JAEGER_ENDPOINT="http://localhost:14268/api/traces"
```

### Multiple Services

Configure each microservice:

```bash
# API Gateway
OTEL_SERVICE_NAME="golive-api-gateway"

# Pipeline Service
OTEL_SERVICE_NAME="golive-pipeline-service"

# Testing Service
OTEL_SERVICE_NAME="golive-testing-service"
```

All traces will appear in Jaeger with proper service attribution.

## Jaeger UI Guide

### Finding Traces

1. **Select Service**: Choose from dropdown
2. **Set Time Range**: Last hour, day, etc.
3. **Add Filters**:
   - Min/Max duration
   - Tags (e.g., `http.status_code=500`)
   - Operation name
4. **Click "Find Traces"**

### Viewing Trace Details

**Trace Timeline**:
- Horizontal bar = span duration
- Nested spans = call hierarchy
- Colors = different services

**Span Details**:
- Tags: Metadata (user.id, http.method, etc.)
- Logs: Events during span
- Process: Service info

### Common Queries

**Find slow requests**:
```
Service: golive-api-gateway
Min Duration: 1000ms
```

**Find errors**:
```
Service: golive-api-gateway
Tags: http.status_code=500
```

**Find specific user requests**:
```
Service: golive-api-gateway
Tags: user.id=user123
```

## Performance Impact

### Overhead

- **Automatic instrumentation**: ~1-3% performance overhead
- **Custom spans**: Negligible (~0.1ms per span)
- **Network**: Async export (non-blocking)

### Production Recommendations

```bash
# Sample 10% of traces in production
OTEL_TRACE_SAMPLE_RATE=0.1

# Disable in test environment
OTEL_ENABLED=false  # in test.env
```

## Troubleshooting

### Traces Not Appearing

**Check Jaeger**:
```bash
# Is Jaeger running?
docker ps | grep jaeger

# Check Jaeger health
curl http://localhost:14268/api/health
```

**Check Backend**:
```bash
# Look for initialization log
[Tracing] Initialized successfully

# Check OTEL_ENABLED is true
echo $OTEL_ENABLED
```

### Connection Refused Error

**Problem**: `ECONNREFUSED localhost:14268`

**Solution**:
```bash
# Ensure Jaeger is running
docker-compose -f docker-compose.tracing.yml up -d

# Check endpoint in .env
JAEGER_ENDPOINT="http://localhost:14268/api/traces"
```

### Spans Not Nested Properly

**Problem**: Spans appear flat instead of nested

**Solution**: Use `withSpan()` for automatic context propagation:

```typescript
// Good - automatic nesting
await withSpan('parent', async () => {
  await withSpan('child', async () => {
    // This will be nested under parent
  });
});

// Bad - manual spans may not nest correctly
const span1 = createSpan('parent');
const span2 = createSpan('child'); // Not nested!
```

## Integration with Sentry

Traces link to Sentry errors:

```typescript
import { captureException } from './config/sentry';
import { recordSpanException } from './config/tracing';

try {
  await riskyOperation();
} catch (error) {
  // Record in both systems
  recordSpanException(error);  // Trace context
  captureException(error);      // Error details
  throw error;
}
```

## Docker Compose Ports

```yaml
jaeger:
  ports:
    - "16686:16686"   # Jaeger UI (http://localhost:16686)
    - "14268:14268"   # Collector HTTP (traces sent here)
    - "9411:9411"     # Zipkin compatible
```

## Best Practices

### 1. Name Spans Descriptively

```typescript
// Good
withSpan('database.users.findById', async () => ...);
withSpan('api.github.fetchRepos', async () => ...);

// Bad
withSpan('query', async () => ...);
withSpan('call', async () => ...);
```

### 2. Add Meaningful Attributes

```typescript
span.setAttribute('user.id', user.id);
span.setAttribute('deployment.env', 'production');
span.setAttribute('pipeline.status', 'running');
span.setAttribute('cache.hit', true);
```

### 3. Use Events for Key Milestones

```typescript
addSpanEvent('build-started');
addSpanEvent('tests-passed', { totalTests: 42 });
addSpanEvent('deployment-complete', { version: 'v1.2.3' });
```

### 4. Record Exceptions

```typescript
try {
  await operation();
} catch (error) {
  recordSpanException(error);  // Adds exception to trace
  throw error;
}
```

### 5. Set Span Status

```typescript
if (success) {
  setSpanStatus(SpanStatusCode.OK);
} else {
  setSpanStatus(SpanStatusCode.ERROR, 'Operation failed');
}
```

## Production Checklist

- [ ] Jaeger running (or cloud alternative)
- [ ] `OTEL_ENABLED=true` in production `.env`
- [ ] Service names configured for all microservices
- [ ] Trace sampling rate set (10-20% recommended)
- [ ] Critical paths instrumented with custom spans
- [ ] Team trained on Jaeger UI
- [ ] Alerts set up for high latency traces
- [ ] Trace retention policy configured

## Advanced: Cloud Deployments

### Jaeger on Kubernetes

```yaml
# Use Jaeger Operator
kubectl create namespace observability
kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.42.0/jaeger-operator.yaml -n observability
```

### Alternative: Managed Services

**Grafana Cloud**: Free tier with Tempo
**Honeycomb**: APM with distributed tracing
**Datadog**: Full observability platform
**New Relic**: APM with tracing

Change exporter:
```bash
OTEL_EXPORTER="otlp"
OTEL_EXPORTER_OTLP_ENDPOINT="https://your-cloud-provider.com/v1/traces"
```

## File Reference

- **Tracing Config**: [backend/api-gateway/src/config/tracing.ts](backend/api-gateway/src/config/tracing.ts)
- **Initialization**: [backend/api-gateway/src/index.ts](backend/api-gateway/src/index.ts#L9)
- **Docker Compose**: [docker-compose.tracing.yml](docker-compose.tracing.yml)
- **Env Example**: [backend/api-gateway/.env.example](backend/api-gateway/.env.example#L46-L63)

## Support

**OpenTelemetry Docs**: https://opentelemetry.io/docs/
**Jaeger Docs**: https://www.jaegertracing.io/docs/
**CNCF Slack**: #opentelemetry channel

---

**Status**: ✅ Distributed Tracing Complete
**Implementation Date**: October 23, 2025
**Coverage**: Backend (Node.js) - Ready for all microservices
**UI**: Jaeger (http://localhost:16686)
