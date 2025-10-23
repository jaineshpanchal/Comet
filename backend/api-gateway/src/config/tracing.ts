import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Span, SpanStatusCode, trace, context } from '@opentelemetry/api';
import { logger } from '../utils/logger';

/**
 * OpenTelemetry Distributed Tracing Configuration
 *
 * Provides end-to-end visibility across microservices with:
 * - Automatic instrumentation (HTTP, Express, Prisma, etc.)
 * - Custom span creation for business logic
 * - Multiple exporter support (Jaeger, Zipkin, OTLP)
 * - Trace context propagation across services
 */

let sdk: NodeSDK | null = null;

export interface TracingConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  exporter: 'jaeger' | 'zipkin' | 'otlp' | 'console';
  enabled: boolean;
  jaegerEndpoint?: string;
  zipkinEndpoint?: string;
  otlpEndpoint?: string;
}

/**
 * Initialize OpenTelemetry tracing
 */
export function initializeTracing(config?: Partial<TracingConfig>): void {
  const defaultConfig: TracingConfig = {
    serviceName: process.env.OTEL_SERVICE_NAME || 'golive-api-gateway',
    serviceVersion: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    exporter: (process.env.OTEL_EXPORTER || 'jaeger') as 'jaeger' | 'zipkin' | 'otlp' | 'console',
    enabled: process.env.OTEL_ENABLED !== 'false',
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    zipkinEndpoint: process.env.ZIPKIN_ENDPOINT || 'http://localhost:9411/api/v2/spans',
    otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  };

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.enabled) {
    logger.info('[Tracing] Disabled via configuration');
    return;
  }

  try {
    // Create trace exporter based on configuration
    const traceExporter = createTraceExporter(finalConfig);

    // Create resource with service information
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: finalConfig.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: finalConfig.serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: finalConfig.environment,
    });

    // Initialize SDK
    sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Automatic instrumentation for common libraries
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            ignoreIncomingPaths: [
              '/health',
              '/metrics',
              '/api/health',
            ],
          },
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-prisma': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-pg': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-redis': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-fs': {
            enabled: false, // Can be noisy
          },
          '@opentelemetry/instrumentation-dns': {
            enabled: false, // Can be noisy
          },
        }),
      ],
    });

    // Start the SDK
    sdk.start();

    logger.info('[Tracing] Initialized successfully', {
      serviceName: finalConfig.serviceName,
      exporter: finalConfig.exporter,
      environment: finalConfig.environment,
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk?.shutdown();
        logger.info('[Tracing] Shut down successfully');
      } catch (error) {
        logger.error('[Tracing] Error during shutdown', { error });
      }
    });
  } catch (error) {
    logger.error('[Tracing] Initialization failed', { error });
  }
}

/**
 * Create trace exporter based on configuration
 */
function createTraceExporter(config: TracingConfig) {
  switch (config.exporter) {
    case 'jaeger':
      logger.info('[Tracing] Using Jaeger exporter', { endpoint: config.jaegerEndpoint });
      return new JaegerExporter({
        endpoint: config.jaegerEndpoint,
      });

    case 'zipkin':
      logger.info('[Tracing] Using Zipkin exporter', { endpoint: config.zipkinEndpoint });
      return new ZipkinExporter({
        url: config.zipkinEndpoint,
      });

    case 'otlp':
      logger.info('[Tracing] Using OTLP exporter', { endpoint: config.otlpEndpoint });
      return new OTLPTraceExporter({
        url: config.otlpEndpoint,
      });

    case 'console':
      logger.info('[Tracing] Using Console exporter (development only)');
      const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
      return new ConsoleSpanExporter();

    default:
      logger.warn('[Tracing] Unknown exporter, defaulting to Jaeger', { exporter: config.exporter });
      return new JaegerExporter({
        endpoint: config.jaegerEndpoint,
      });
  }
}

/**
 * Get the tracer for creating custom spans
 */
export function getTracer(name: string = 'golive-api-gateway') {
  return trace.getTracer(name);
}

/**
 * Create a custom span for manual instrumentation
 *
 * @example
 * const span = createSpan('process-pipeline');
 * try {
 *   await processPipeline();
 *   span.setStatus({ code: SpanStatusCode.OK });
 * } catch (error) {
 *   span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
 *   span.recordException(error);
 *   throw error;
 * } finally {
 *   span.end();
 * }
 */
export function createSpan(name: string, attributes?: Record<string, any>): Span {
  const tracer = getTracer();
  const span = tracer.startSpan(name, {
    attributes: attributes || {},
  });
  return span;
}

/**
 * Execute a function within a span
 * Automatically handles span lifecycle and errors
 *
 * @example
 * await withSpan('database-query', async (span) => {
 *   span.setAttribute('query', 'SELECT * FROM users');
 *   return await db.query('SELECT * FROM users');
 * });
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(name, { attributes: attributes || {} }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Add attributes to the current active span
 */
export function addSpanAttributes(attributes: Record<string, any>): void {
  const span = trace.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

/**
 * Add an event to the current active span
 */
export function addSpanEvent(name: string, attributes?: Record<string, any>): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Set the status of the current active span
 */
export function setSpanStatus(code: SpanStatusCode, message?: string): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setStatus({ code, message });
  }
}

/**
 * Record an exception in the current active span
 */
export function recordSpanException(error: Error): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}

/**
 * Get the current trace context for propagation
 */
export function getCurrentTraceContext() {
  return context.active();
}

/**
 * Middleware to add trace context to requests
 */
export function tracingMiddleware(req: any, res: any, next: any): void {
  const span = trace.getActiveSpan();

  if (span) {
    // Add request metadata to span
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.url', req.url);
    span.setAttribute('http.route', req.route?.path || req.path);
    span.setAttribute('http.user_agent', req.get('user-agent') || 'unknown');

    if (req.user) {
      span.setAttribute('user.id', req.user.userId || req.user.id);
      span.setAttribute('user.email', req.user.email);
    }

    if (req.get('x-request-id')) {
      span.setAttribute('request.id', req.get('x-request-id'));
    }

    // Add response status code when response finishes
    res.on('finish', () => {
      span.setAttribute('http.status_code', res.statusCode);

      if (res.statusCode >= 500) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Server error' });
      } else if (res.statusCode >= 400) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Client error' });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
    });
  }

  next();
}

/**
 * Utility to trace database operations
 */
export async function traceDatabase<T>(
  operation: string,
  query: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`db.${operation}`, async (span) => {
    span.setAttribute('db.system', 'postgresql');
    span.setAttribute('db.operation', operation);
    span.setAttribute('db.statement', query);

    return await fn();
  });
}

/**
 * Utility to trace external HTTP calls
 */
export async function traceHttpCall<T>(
  method: string,
  url: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`http.${method.toLowerCase()}`, async (span) => {
    span.setAttribute('http.method', method);
    span.setAttribute('http.url', url);
    span.setAttribute('span.kind', 'client');

    try {
      const result = await fn();
      span.setAttribute('http.status_code', 200); // Adjust based on actual response
      return result;
    } catch (error) {
      span.setAttribute('http.status_code', 500);
      throw error;
    }
  });
}

/**
 * Utility to trace service-to-service calls
 */
export async function traceServiceCall<T>(
  serviceName: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return withSpan(`service.${serviceName}.${operation}`, async (span) => {
    span.setAttribute('service.name', serviceName);
    span.setAttribute('service.operation', operation);
    span.setAttribute('span.kind', 'client');

    return await fn();
  });
}

/**
 * Shutdown tracing gracefully
 */
export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      logger.info('[Tracing] Shut down successfully');
    } catch (error) {
      logger.error('[Tracing] Error during shutdown', { error });
    }
  }
}

export default {
  initializeTracing,
  getTracer,
  createSpan,
  withSpan,
  addSpanAttributes,
  addSpanEvent,
  setSpanStatus,
  recordSpanException,
  getCurrentTraceContext,
  tracingMiddleware,
  traceDatabase,
  traceHttpCall,
  traceServiceCall,
  shutdownTracing,
};
