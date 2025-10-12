// Main entry point for the API Gateway
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import apiGateway from './server';

// Start the server
apiGateway.start().catch((error) => {
  console.error('Failed to start API Gateway:', error);
  process.exit(1);
});