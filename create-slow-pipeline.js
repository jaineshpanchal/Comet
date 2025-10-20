const axios = require('axios');

const API_URL = 'http://localhost:8000';

async function createSlowPipeline() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@comet.dev',
      password: 'password123'
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful!\n');

    // Get first project
    const projectsResponse = await axios.get(`${API_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const projectId = projectsResponse.data.data[0].id;

    // Create slow pipeline
    console.log('🚀 Creating slow demo pipeline...');

    const pipelineData = {
      name: 'Slow Demo Pipeline (Watch in Docker Desktop)',
      description: 'Pipeline with 15-second stages to view in Docker Desktop',
      projectId,
      trigger: 'MANUAL',
      stages: [
        {
          name: 'Build',
          type: 'BUILD',
          commands: [
            'echo "Starting build stage..."',
            'echo "Pulling dependencies..."',
            'sleep 5',
            'echo "Compiling code..."',
            'sleep 5',
            'echo "Creating artifacts..."',
            'sleep 5',
            'echo "Build complete!"'
          ],
          timeout: 60
        },
        {
          name: 'Test',
          type: 'TEST',
          commands: [
            'echo "Starting test stage..."',
            'echo "Running unit tests..."',
            'sleep 5',
            'echo "Running integration tests..."',
            'sleep 5',
            'echo "Running E2E tests..."',
            'sleep 5',
            'echo "All tests passed!"'
          ],
          timeout: 60
        },
        {
          name: 'Security Scan',
          type: 'SECURITY_SCAN',
          commands: [
            'echo "Starting security scan..."',
            'echo "Scanning dependencies..."',
            'sleep 5',
            'echo "Analyzing code..."',
            'sleep 5',
            'echo "Generating report..."',
            'sleep 5',
            'echo "Security scan complete - no vulnerabilities found!"'
          ],
          timeout: 60
        }
      ]
    };

    const response = await axios.post(`${API_URL}/api/pipelines`, pipelineData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Pipeline created successfully!');
    console.log('\n📊 Pipeline Details:');
    console.log(`   ID: ${response.data.data.id}`);
    console.log(`   Name: ${response.data.data.name}`);
    console.log(`   Stages: ${JSON.parse(response.data.data.stages).length}`);
    console.log(`\n🔍 View in UI: http://localhost:3030/pipelines/${response.data.data.id}`);
    console.log(`\n💡 Trigger this pipeline and watch Docker Desktop!`);
    console.log(`   Each stage will run for ~15 seconds in a Docker container.`);

    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

createSlowPipeline();
