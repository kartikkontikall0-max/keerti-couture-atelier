'use strict';

/**
 * ==============================================================================
 * KEERTI COUTURE — SEC-01 INPUT VALIDATION REMEDIATION VERIFICATION SUITE
 * ==============================================================================
 * Tests both authUser and registerUser with malicious, malformed, non-string,
 * NoSQL-style, and valid payloads. Verifies 400 rejection with safe message and
 * zero 500 TypeError crashes.
 */

process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test_jwt_secret_sec01_remediation_32_chars';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';

const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const connectDB = require('../config/db');
const { disconnectDB } = require('../config/db');
const User = require('../models/User');

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) {
      reqBody = JSON.stringify(body);
      if (!reqHeaders['Content-Type']) reqHeaders['Content-Type'] = 'application/json';
    } else if (typeof body === 'string') {
      reqBody = body;
    }

    if (reqBody) {
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName} - ${details}`);
    failures.push({ testName, details });
  }
}

async function runSec01Suite() {
  console.log('============================================================');
  console.log('  KEERTI COUTURE — SEC-01 REMEDIATION AUTOMATED TEST SUITE  ');
  console.log('============================================================\n');

  try {
    await connectDB();
    server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    baseUrl = `http://localhost:${server.address().port}`;
    console.log(`[Test Server] Running on ${baseUrl}\n`);

    await User.deleteMany({});

    // Seed 1 active test patron
    await User.create({
      name: 'Existing Patron',
      email: 'patron@example.com',
      password: 'StrongP@ssw0rd2026',
      phone: '9900112233'
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 1: LOGIN (authUser) NON-STRING & MALFORMED INPUT DEFENSE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: Login (authUser) Input Validation & NoSQL Defense ---');

    // 1. Valid string credentials -> 200 OK
    const validLogin = await request('POST', '/api/users/login', {
      email: 'patron@example.com',
      password: 'StrongP@ssw0rd2026'
    });
    assert(validLogin.status === 200 && Boolean(validLogin.body.token), 'Valid string credentials login succeeds (200 OK)');

    // 2. Missing email -> 400
    const missingEmailLogin = await request('POST', '/api/users/login', {
      password: 'StrongP@ssw0rd2026'
    });
    assert(missingEmailLogin.status === 400 && !missingEmailLogin.body.token, 'Missing email rejected with 400 Bad Request');

    // 3. Missing password -> 400
    const missingPassLogin = await request('POST', '/api/users/login', {
      email: 'patron@example.com'
    });
    assert(missingPassLogin.status === 400 && !missingPassLogin.body.token, 'Missing password rejected with 400 Bad Request');

    // 4. Null email -> 400
    const nullEmailLogin = await request('POST', '/api/users/login', {
      email: null,
      password: 'StrongP@ssw0rd2026'
    });
    assert(nullEmailLogin.status === 400, 'Null email rejected with 400 Bad Request');

    // 5. Object email (NoSQL injection payload stripped or unstripped) -> 400 (NO 500 TypeError)
    const objectEmailLogin = await request('POST', '/api/users/login', {
      email: { $gt: '' },
      password: 'StrongP@ssw0rd2026'
    });
    assert(objectEmailLogin.status === 400, 'Object email (NoSQL injection) rejected with 400 Bad Request (NO 500 TypeError)');

    // 6. Plain object email {} -> 400
    const emptyObjectEmailLogin = await request('POST', '/api/users/login', {
      email: {},
      password: 'StrongP@ssw0rd2026'
    });
    assert(emptyObjectEmailLogin.status === 400, 'Empty object email {} rejected with 400 Bad Request');

    // 7. Array email -> 400
    const arrayEmailLogin = await request('POST', '/api/users/login', {
      email: ['patron@example.com'],
      password: 'StrongP@ssw0rd2026'
    });
    assert(arrayEmailLogin.status === 400, 'Array email rejected with 400 Bad Request');

    // 8. Object password -> 400
    const objectPassLogin = await request('POST', '/api/users/login', {
      email: 'patron@example.com',
      password: { $ne: '' }
    });
    assert(objectPassLogin.status === 400, 'Object password rejected with 400 Bad Request');

    // 9. Array password -> 400
    const arrayPassLogin = await request('POST', '/api/users/login', {
      email: 'patron@example.com',
      password: ['StrongP@ssw0rd2026']
    });
    assert(arrayPassLogin.status === 400, 'Array password rejected with 400 Bad Request');

    // 10. Number email / Number password -> 400
    const numberEmailLogin = await request('POST', '/api/users/login', {
      email: 12345,
      password: 67890
    });
    assert(numberEmailLogin.status === 400, 'Numeric email and password rejected with 400 Bad Request');

    // 11. Blank string email -> 400
    const blankEmailLogin = await request('POST', '/api/users/login', {
      email: '   ',
      password: 'StrongP@ssw0rd2026'
    });
    assert(blankEmailLogin.status === 400, 'Whitespace-only email rejected with 400 Bad Request');

    // 12. Invalid password format / wrong password -> 401 Unauthorized
    const wrongPassLogin = await request('POST', '/api/users/login', {
      email: 'patron@example.com',
      password: 'IncorrectPassword'
    });
    assert(wrongPassLogin.status === 401, 'Wrong password rejected with 401 Unauthorized');


    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 2: REGISTRATION (registerUser) NON-STRING & MALFORMED INPUT DEFENSE
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: Registration (registerUser) Input Validation & NoSQL Defense ---');

    // 13. Valid string registration -> 201 Created
    const validReg = await request('POST', '/api/users', {
      name: 'Valid New Customer',
      email: 'valid.new@example.com',
      password: 'ValidPassword@2026',
      phone: '9888877777'
    });
    assert(validReg.status === 201 && Boolean(validReg.body.token), 'Valid string registration succeeds (201 Created)');

    // 14. Missing name -> 400
    const missingNameReg = await request('POST', '/api/users', {
      email: 'noname@example.com',
      password: 'ValidPassword@2026'
    });
    assert(missingNameReg.status === 400, 'Missing name rejected with 400 Bad Request');

    // 15. Object name -> 400
    const objectNameReg = await request('POST', '/api/users', {
      name: { $gt: '' },
      email: 'objname@example.com',
      password: 'ValidPassword@2026'
    });
    assert(objectNameReg.status === 400, 'Object name rejected with 400 Bad Request (NO TypeError on name.trim)');

    // 16. Missing email -> 400
    const missingEmailReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      password: 'ValidPassword@2026'
    });
    assert(missingEmailReg.status === 400, 'Missing email in registration rejected with 400 Bad Request');

    // 17. Null email -> 400
    const nullEmailReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: null,
      password: 'ValidPassword@2026'
    });
    assert(nullEmailReg.status === 400, 'Null email in registration rejected with 400 Bad Request');

    // 18. Object email (NoSQL injection payload) -> 400
    const objectEmailReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: { $gt: '' },
      password: 'ValidPassword@2026'
    });
    assert(objectEmailReg.status === 400, 'Object email in registration rejected with 400 Bad Request (NO TypeError on email.trim)');

    // 19. Array email -> 400
    const arrayEmailReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: ['test@example.com'],
      password: 'ValidPassword@2026'
    });
    assert(arrayEmailReg.status === 400, 'Array email in registration rejected with 400 Bad Request');

    // 20. Invalid email regex format -> 400
    const invalidEmailFormatReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: 'not-an-email-at-all',
      password: 'ValidPassword@2026'
    });
    assert(invalidEmailFormatReg.status === 400, 'Invalid email format rejected with 400 Bad Request');

    // 21. Missing password -> 400
    const missingPassReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: 'missingpass@example.com'
    });
    assert(missingPassReg.status === 400, 'Missing password in registration rejected with 400 Bad Request');

    // 22. Short password (< 6 chars) -> 400
    const shortPassReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: 'shortpass@example.com',
      password: '123'
    });
    assert(shortPassReg.status === 400, 'Short password (< 6 chars) rejected with 400 Bad Request');

    // 23. Object password -> 400
    const objectPassReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: 'objpass@example.com',
      password: { $gt: '123456' }
    });
    assert(objectPassReg.status === 400, 'Object password rejected with 400 Bad Request (NO TypeError)');

    // 24. Array password -> 400
    const arrayPassReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: 'arrpass@example.com',
      password: ['12345678']
    });
    assert(arrayPassReg.status === 400, 'Array password rejected with 400 Bad Request');

    // 25. Object phone -> 400
    const objectPhoneReg = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: 'objphone@example.com',
      password: 'ValidPassword@2026',
      phone: { $ne: '' }
    });
    assert(objectPhoneReg.status === 400, 'Object phone rejected with 400 Bad Request');

    console.log('\n============================================================');
    console.log(`  SEC-01 TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
    console.log('============================================================\n');

    if (failedTests > 0) {
      console.error('Failures detected:', failures);
      process.exitCode = 1;
    }
  } finally {
    if (server) server.close();
    await disconnectDB();
  }
}

runSec01Suite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

