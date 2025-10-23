// Main entry point for the API Gateway
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Initialize OpenTelemetry tracing BEFORE any other imports
// This ensures automatic instrumentation works correctly
import { initializeTracing } from './config/tracing';
initializeTracing();

import apiGateway from './server';

// Start the server
apiGateway.start().catch((error) => {
  console.error('Failed to start API Gateway:', error);
  process.exit(1);
});