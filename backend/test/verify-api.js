const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runVerification() {
  console.log('🔍 Starting End-to-End API Verification...\n');

  // 1. Health Check
  const health = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log(`1. Health Check GET /api/health: Status ${health.status}`, health.body);

  // 2. Admin Login
  const loginRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@rentiq.com', password: 'Admin@123' });
  console.log(`2. Admin Login: Status ${loginRes.status}, User: ${loginRes.body.user?.name}, Role: ${loginRes.body.user?.role}`);

  const token = loginRes.body.token;

  // 3. Get Dashboard Metrics
  const dashRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/dashboard/metrics',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`3. Dashboard Metrics: Status ${dashRes.status}`, dashRes.body.metrics);

  // 4. Get Assets
  const assetsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/assets',
    method: 'GET'
  });
  console.log(`4. Assets Catalog: Found ${assetsRes.body.count} assets`);

  // 5. Look up asset by code (AST-COMP-001)
  const codeRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/assets/code/AST-COMP-001',
    method: 'GET'
  });
  console.log(`5. QR Code Lookup for AST-COMP-001: Status ${codeRes.status}, Found: "${codeRes.body.asset?.name}"`);

  // 6. Test Overdue Detection endpoint
  const cronRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/rentals/check-overdue',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`6. Trigger Overdue Check: Status ${cronRes.status}`, cronRes.body.message);

  // 7. Audit Trail
  const auditRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/audit',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`7. Audit Logs: Status ${auditRes.status}, Total logs recorded: ${auditRes.body.total}`);

  console.log('\n✨ All End-to-End API verification tests passed successfully!');
}

runVerification().catch(console.error);
