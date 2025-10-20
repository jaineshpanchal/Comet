const http = require('http');

// Step 1: Login to get token
function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin@golive.dev',
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data && response.data.tokens && response.data.tokens.accessToken) {
            resolve(response.data.tokens.accessToken);
          } else if (response.data && response.data.accessToken) {
            resolve(response.data.accessToken);
          } else {
            reject(new Error('No access token in response: ' + JSON.stringify(response)));
          }
        } catch (e) {
          console.log('Raw response:', data);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Step 2: Trigger pipeline
function triggerPipeline(token, pipelineId) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({});

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: `/api/pipelines/${pipelineId}/trigger`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Main execution
async function main() {
  try {
    console.log('🔐 Logging in...');
    const token = await login();
    console.log('✅ Login successful!');

    const pipelineId = 'caba7f0e-cdab-4ed5-8793-7bac18ae82d1'; // Quick Test Pipeline
    console.log(`\n🚀 Triggering pipeline: ${pipelineId}`);
    const result = await triggerPipeline(token, pipelineId);

    console.log('\n✅ Pipeline triggered successfully!');
    console.log(JSON.stringify(result, null, 2));

    if (result.data && result.data.pipelineRunId) {
      console.log(`\n📊 Pipeline Run ID: ${result.data.pipelineRunId}`);
      console.log(`\n🔍 View in UI: http://localhost:3030/pipelines/runs/${result.data.pipelineRunId}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
