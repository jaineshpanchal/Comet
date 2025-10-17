// User Management Service - Proxy to full implementation
// This file redirects to the full User Management Service implementation
console.log('🔄 Starting User Management Service...');
console.log('📁 Location: /backend/services/user-management/');
console.log('🌐 Expected Port: 3001');
console.log('');
console.log('⚠️  Note: This is a stub file. The full implementation is in the user-management directory.');
console.log('💡 To start the full service, run: cd user-management && npm run dev');
console.log('');

// Simple health check service on port 8002 for the gateway
import express from 'express';

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 8002;

app.use(express.json());

// Redirect health check to indicate this is a stub
app.get('/health', (req, res) => {
  res.json({
    status: 'stub',
    service: 'user-service-stub',
    message: 'This is a stub service. Full implementation is in user-management directory.',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    fullServiceLocation: 'backend/services/user-management/',
    fullServicePort: 3001
  });
});

// Catch all routes
app.use('*', (req, res) => {
  res.status(503).json({
    error: 'Service Unavailable',
    message: 'This is a stub service. Please use the full User Management Service at port 3001.',
    fullServiceEndpoint: 'http://localhost:3001' + req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`📡 User Service stub running on port ${PORT}`);
  console.log(`🎯 Full service available at: http://localhost:3001`);
});

export default app;