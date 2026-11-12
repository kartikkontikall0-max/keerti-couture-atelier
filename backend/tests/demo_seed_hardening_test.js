/**
 * ==============================================================================
 * KEERTI COUTURE — PHASE 2 DEMO SEED HARDENING & AUTHORIZATION REGRESSION SUITE
 * ==============================================================================
 * Tests the robust safety guards of validateDemoSeedConfig, password hashing
 * integrity, role-based authorization, and IDOR customer separation.
 * ==============================================================================
 */

'use strict';

process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test_jwt_secret_antigravity_phase2_32_chars';

const http = require('http');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { app } = require('../server');
const connectDB = require('../config/db');
const { disconnectDB } = require('../config/db');
const { validateDemoSeedConfig } = require('../config/validateDemoSeed');
const User = require('../models/User');
const Order = require('../models/Order');

let server;
let baseUrl;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ [PASS] ${message}`);
}

async function runTests() {
  console.log('============================================================');
  console.log('  KEERTI COUTURE — DEMO SEED HARDENING & ACCESS TESTS       ');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function test(desc, fn) {
    total++;
    try {
      fn();
      passed++;
    } catch (err) {
      console.error(`Test failed: ${desc}`);
      throw err;
    }
  }

  async function testAsync(desc, fn) {
    total++;
    try {
      await fn();
      passed++;
    } catch (err) {
      console.error(`Async test failed: ${desc}`);
      throw err;
    }
  }

  // ── 1. DEMO SEED CONFIGURATION GUARDS ─────────────────────
  console.log('--- SUITE 1: validateDemoSeedConfig Unit Verification ---');

  test('1. Local demo database accepted under approved configuration', () => {
    const res = validateDemoSeedConfig({
      nodeEnv: 'development',
      mongoUri: 'mongodb://localhost:27017/keerti_couture_demo',
      allowDemoSeed: true
    });
    assert(res.safe === true, 'Approved local demo configuration is marked safe');
    assert(res.hostname === 'localhost', 'Host correctly identified as localhost');
    assert(res.dbName === 'keerti_couture_demo', 'Database name matches keerti_couture_demo');
  });

  test('2. Remote MongoDB host rejected', () => {
    const res = validateDemoSeedConfig({
      nodeEnv: 'development',
      mongoUri: 'mongodb://cloud-mongo.example.com:27017/keerti_couture_demo',
      allowDemoSeed: true
    });
    assert(res.safe === false, 'Remote host is rejected');
    assert(res.reason.includes('Remote host'), 'Provides clear remote host rejection reason');
  });

  test('3. mongodb+srv:// cloud cluster rejected', () => {
    const res = validateDemoSeedConfig({
      nodeEnv: 'development',
      mongoUri: 'mongodb+srv://user:pass@cluster0.mongodb.net/keerti_couture_demo',
      allowDemoSeed: true
    });
    assert(res.safe === false, 'mongodb+srv cloud connection is rejected');
    assert(res.reason.includes('remote cloud database cluster'), 'Flags remote cloud cluster');
  });

  test('4. Production environment strictly rejected', () => {
    const res = validateDemoSeedConfig({
      nodeEnv: 'production',
      mongoUri: 'mongodb://localhost:27017/keerti_couture_demo',
      allowDemoSeed: true
    });
    assert(res.safe === false, 'Production mode rejected regardless of URI');
    assert(res.reason.includes('strictly forbidden in production mode'), 'Flags production prohibition');
  });

  test('5. Invalid MongoDB URI rejected', () => {
    const res = validateDemoSeedConfig({
      nodeEnv: 'development',
      mongoUri: 'not_a_valid_uri',
      allowDemoSeed: true
    });
    assert(res.safe === false, 'Invalid URI format rejected');
    assert(res.reason.includes('PARSE ERROR'), 'Flags URI parse error');
  });

  test('6. Missing explicit demo authorization rejected in development', () => {
    const res = validateDemoSeedConfig({
      nodeEnv: 'development',
      mongoUri: 'mongodb://localhost:27017/keerti_couture_demo',
      allowDemoSeed: false
    });
    assert(res.safe === false, 'Missing allowDemoSeed authorization rejected');
    assert(res.reason.includes('requires explicit authorization'), 'Explains required authorization flag');
  });

  test('7. Database name mismatch rejected (protects non-demo database)', () => {
    const res = validateDemoSeedConfig({
      nodeEnv: 'development',
      mongoUri: 'mongodb://localhost:27017/tailor_shop',
      allowDemoSeed: true
    });
    assert(res.safe === false, 'Production database name rejected even on localhost');
    assert(res.reason.includes('DATABASE NAME MISMATCH'), 'Flags database name naming policy');
  });

  test('8. Substring spoofing rejected (URI containing "demo" in user or query)', () => {
    const res = validateDemoSeedConfig({
      nodeEnv: 'development',
      mongoUri: 'mongodb://demo_user:pass@localhost:27017/production_orders',
      allowDemoSeed: true
    });
    assert(res.safe === false, 'Substring matching inside username is not sufficient');
    assert(res.reason.includes('DATABASE NAME MISMATCH'), 'Validates actual db path instead of whole string');
  });

  // ── 2. PASSWORD HASHING & SECURITY ─────────────────────────
  console.log('\n--- SUITE 2: Password Hashing Verification ---');
  await connectDB();

  await testAsync('9. Passwords are securely hashed with bcrypt, never stored plaintext', async () => {
    const plainPassword = 'DemoCustomerSecure@2026';
    const testUser = new User({
      name: 'Password Hash Test User',
      email: `hash_test_${Date.now()}@example.com`,
      password: plainPassword,
      isAdmin: false
    });
    await testUser.save();

    assert(testUser.password !== plainPassword, 'Password property is not plaintext');
    assert(testUser.password.startsWith('$2a$') || testUser.password.startsWith('$2b$'), 'Password has valid bcrypt prefix');
    const isMatch = await bcrypt.compare(plainPassword, testUser.password);
    assert(isMatch === true, 'bcrypt.compare validates password matches original input');
  });

  // ── 3. AUTHORIZATION & IDOR ACCESS GUARDS ─────────────────
  console.log('\n--- SUITE 3: Role Authorization & IDOR Access Guards ---');

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  await testAsync('10. Customer cannot access administrative payment endpoints (403 Forbidden)', async () => {
    // Register customer
    const regRes = await makeRequest('POST', '/api/users', {
      name: 'Regular Customer',
      email: `customer_auth_${Date.now()}@example.com`,
      password: 'ValidPassword123!'
    });
    assert(regRes.status === 201, 'Customer registered successfully');
    const token = regRes.body.token;

    // Attempt calling admin payment endpoint
    const dummyOrderId = new mongoose.Types.ObjectId().toString();
    const payRes = await makeRequest('PUT', `/api/orders/${dummyOrderId}/pay`, {}, {
      Authorization: `Bearer ${token}`
    });
    assert(payRes.status === 403, 'Customer blocked with 403 Forbidden on admin payment route');
  });

  await testAsync('11. Customer B cannot access Customer A order (IDOR Protection)', async () => {
    // Register Customer A
    const custARes = await makeRequest('POST', '/api/users', {
      name: 'Customer A',
      email: `cust_a_${Date.now()}@example.com`,
      password: 'ValidPassword123!'
    });
    const tokenA = custARes.body.token;
    const userAId = custARes.body._id;

    // Create Order for Customer A
    const orderA = new Order({
      user: userAId,
      customerName: 'Customer A',
      phone: '9988776655',
      design: new mongoose.Types.ObjectId(),
      totalPrice: 3500,
      paymentMethod: 'PayOnline',
      paymentStatus: 'Pending',
      status: 'Order received'
    });
    await orderA.save();

    // Register Customer B
    const custBRes = await makeRequest('POST', '/api/users', {
      name: 'Customer B',
      email: `cust_b_${Date.now()}@example.com`,
      password: 'ValidPassword123!'
    });
    const tokenB = custBRes.body.token;

    // Customer B requests Customer A's order
    const idorRes = await makeRequest('GET', `/api/orders/${orderA._id}`, null, {
      Authorization: `Bearer ${tokenB}`
    });
    assert(idorRes.status === 403, 'Customer B is rejected with 403 Forbidden accessing Customer A order');

    // Customer A requests Customer A's order
    const validRes = await makeRequest('GET', `/api/orders/${orderA._id}`, null, {
      Authorization: `Bearer ${tokenA}`
    });
    assert(validRes.status === 200, 'Customer A can view their own order with 200 OK');
  });

  await testAsync('12. Authentication failure returns generic safe error without disclosing account existence', async () => {
    const fakeLogin = await makeRequest('POST', '/api/users/login', {
      email: 'nonexistent_user@example.com',
      password: 'WrongPassword99!'
    });
    assert(fakeLogin.status === 401, 'Returns HTTP 401 Unauthorized');
    assert(fakeLogin.body.message === 'Invalid email or password', 'Returns generic safe message preventing user enumeration');
  });

  if (server) {
    server.close();
  }
  await disconnectDB();

  console.log('\n============================================================');
  console.log(`  DEMO SEED HARDENING TESTS COMPLETE: ${passed} / ${total} PASSED`);
  console.log('============================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FATAL ERROR:', err);
  if (server) server.close();
  process.exit(1);
});
