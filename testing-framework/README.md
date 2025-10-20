# Testing Framework

## Overview
The Testing Framework is a comprehensive AI-powered testing suite for the GoLive DevOps Platform. It provides automated testing capabilities across API testing, end-to-end testing, and load testing with intelligent test generation and analysis.

## Architecture
The framework consists of three microservices:
- **API Testing Service** (Port 8006): Automated API testing with AI-generated test cases
- **E2E Testing Service** (Port 8007): Cross-browser end-to-end testing with visual regression
- **Load Testing Service** (Port 8008): Performance and load testing with real-time metrics

## Services

### API Testing Service
- **Port**: 8006
- **Features**:
  - Test suite management (CRUD operations)
  - AI-powered test case generation using OpenAI
  - Automated test execution with validation
  - Smart test data generation
  - Real-time test reporting

### E2E Testing Service  
- **Port**: 8007
- **Features**:
  - Multi-browser testing (Chromium, Firefox, WebKit)
  - AI-powered scenario generation
  - Visual regression testing
  - Screenshot and video recording
  - Cross-platform testing support

### Load Testing Service
- **Port**: 8008
- **Features**:
  - Multiple load patterns (constant, ramp-up, spike, stress)
  - Real-time performance metrics
  - AI-generated load test configurations
  - Performance analysis and bottleneck detection
  - Threshold-based pass/fail criteria

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key (for AI features)

### Installation
```bash
cd testing-framework
npm install
```

### Configuration
1. Copy `.env.example` to `.env`
2. Update the OpenAI API key and other configuration values

### Running the Services
```bash
# Start all services in development mode
npm run dev

# Start individual services
npm run dev:api    # API Testing Service
npm run dev:e2e    # E2E Testing Service  
npm run dev:load   # Load Testing Service
```

## API Endpoints

### API Testing Service (8006)
- `GET /health` - Health check
- `POST /api/test-suites` - Create test suite
- `GET /api/test-suites` - List test suites
- `POST /api/test-suites/:id/execute` - Execute test suite
- `POST /api/ai/generate-tests` - AI test generation
- `POST /api/ai/generate-data` - AI test data generation

### E2E Testing Service (8007)
- `GET /health` - Health check
- `POST /api/scenarios` - Create test scenario
- `GET /api/scenarios` - List scenarios
- `POST /api/scenarios/:id/execute` - Execute scenario
- `POST /api/ai/generate-scenarios` - AI scenario generation
- `GET /api/executions/:id/screenshots` - Get screenshots

### Load Testing Service (8008)
- `GET /health` - Health check
- `POST /api/load-tests` - Create load test config
- `GET /api/load-tests` - List load test configs
- `POST /api/load-tests/:id/execute` - Execute load test
- `GET /api/load-executions/:id` - Get execution status
- `POST /api/ai/generate-load-tests` - AI load test generation
- `GET /api/load-executions/:id/analysis` - Performance analysis

## AI Features

### Test Generation
- Automatically generates API test cases based on OpenAPI specifications
- Creates realistic test data using AI models
- Generates E2E scenarios from user stories
- Optimizes load test configurations based on expected traffic

### Smart Analysis
- Identifies performance bottlenecks using AI analysis
- Provides optimization recommendations
- Detects test patterns and suggests improvements
- Automated root cause analysis for failures

## Testing

```bash
# Run all tests
npm test

# Run specific service tests
npm run test:api
npm run test:e2e
npm run test:load

# Run with coverage
npm run test:coverage
```

## Integration

### With GoLive Platform
The testing framework integrates with the main GoLive platform services:
- **API Gateway**: Routes testing requests through the main gateway
- **User Management**: Uses platform authentication for test access
- **Project Management**: Links tests to specific projects
- **CI/CD Pipeline**: Automated test execution in deployment workflows

### External Integrations
- **OpenAI**: AI-powered test generation and analysis
- **Playwright**: Browser automation for E2E testing
- **Artillery**: Load testing engine
- **Jest**: Unit testing framework

## Monitoring

Each service provides:
- Health check endpoints
- Structured logging with Winston
- Performance metrics
- Error tracking and reporting

## Security

- CORS protection
- Helmet security headers
- Input validation with Joi
- Rate limiting for API endpoints
- Secure test data handling

## Performance

- Concurrent test execution
- Resource pooling for browsers
- Efficient memory management
- Real-time metrics collection
- Scalable load testing up to 10,000 virtual users

## Development

### Project Structure
```
testing-framework/
├── src/
│   ├── api-testing/     # API testing service
│   ├── e2e-testing/     # E2E testing service
│   └── load-testing/    # Load testing service
├── tests/               # Test files
├── docs/               # Documentation
└── package.json        # Dependencies and scripts
```

### Adding New Features
1. Choose the appropriate service directory
2. Add new endpoints to the service
3. Update the interface definitions
4. Add tests for new functionality
5. Update documentation

## Troubleshooting

### Common Issues
1. **Playwright Installation**: Run `npx playwright install` to download browsers
2. **OpenAI API**: Ensure valid API key is set in environment variables
3. **Port Conflicts**: Check if ports 8006-8008 are available
4. **Memory Issues**: Increase Node.js memory limit for large test suites

### Logs
Check service logs for detailed error information:
```bash
tail -f logs/api-testing.log
tail -f logs/e2e-testing.log
tail -f logs/load-testing.log
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests for review

## License

MIT License - see LICENSE file for details