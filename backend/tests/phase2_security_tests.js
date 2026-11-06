/**
 * Keerti Couture — Phase 2 Security, Payment, Database & Runtime Verification Suite
 *
 * Covers:
 * 1. Health check & DB connection probe
 * 2. In-memory DB production safety guard
 * 3. User registration & authentication input validation
 * 4. IDOR vulnerability fix on GET /api/orders/:id
 * 5. Unauthorized payment tampering prevention on PUT /api/orders/:id/pay
 * 6. Razorpay payment verification ownership, HMAC validation, idempotency & duplicate checks
 * 7. Razorpay webhook signature verification, reconciliation, and idempotency
 * 8. Mongoose 9 service deletion runtime crash fix
 * 9. Order retry lifecycle (preventing duplicate draft orders)
 */

process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test_jwt_secret_antigravity_32_characters_long';
process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_key_id';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_mock_secret_key_12345';
process.env.RAZORPAY_WEBHOOK_SECRET = 'rzp_webhook_secret_key_secure_99';

const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { app } = require('../server');
const connectDB = require('../config/db');
const { disconnectDB } = require('../config/db');
const User = require('../models/User');
const Design = require('../models/Design');
const Order = require('../models/Order');
const Service = require('../models/Service');

let server;
let baseUrl;

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqHeaders = { ...headers };
    let reqBody = null;

    if (body) {
      if (typeof body === 'string') {
        reqBody = body;
      } else {
        reqBody = JSON.stringify(body);
        if (!reqHeaders['Content-Type']) {
          reqHeaders['Content-Type'] = 'application/json';
        }
      }
      reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

// Test runner summary
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

async function runAllTests() {
  console.log('\n============================================================');
  console.log('  KEERTI COUTURE — PHASE 2 AUTOMATED SECURITY & PAYMENT TESTS');
  console.log('============================================================\n');

  try {
    // 0. Setup test server & isolated in-memory DB
    console.log('[Setup] Connecting to in-memory test database...');
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`[Setup] Test server running on ${baseUrl}\n`);

    // Clean any initial data
    await User.deleteMany({});
    await Design.deleteMany({});
    await Order.deleteMany({});
    await Service.deleteMany({});

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 1: System Health Probe & In-Memory DB Production Guard
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- SUITE 1: System Health & Database Environment Guards ---');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200, 'Health check returns 200 OK');
    assert(healthRes.body.status === 'healthy', 'Health check reports status: healthy');
    assert(healthRes.body.database === 'connected', 'Health check reports database: connected');

    // Test production guard
    let prodGuardPassed = false;
    try {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.MONGO_URI = 'mongodb://memory:27017/dummy';
      // Re-running connectDB with memory in prod should throw error
      await connectDB();
    } catch (err) {
      prodGuardPassed = err.message.includes('Production environment cannot use an in-memory database');
    } finally {
      process.env.NODE_ENV = 'test';
      process.env.USE_MEMORY_DB = 'true';
      delete process.env.MONGO_URI;
    }
    assert(prodGuardPassed, 'Production environment strictly rejects in-memory database configuration');

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 2: User Registration, Input Sanitization & Password Policies
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: Authentication & Input Validation ---');

    // Weak password rejection
    const weakPassRes = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: 'weakpass@example.com',
      password: '123',
    });
    assert(weakPassRes.status === 400, 'Rejects registration with password shorter than 6 characters');

    // Invalid email rejection
    const invalidEmailRes = await request('POST', '/api/users', {
      name: 'Test Customer',
      email: 'not-an-email',
      password: 'validPassword123',
    });
    assert(invalidEmailRes.status === 400, 'Rejects registration with invalid email format');

    // Valid Customer A registration
    const regCustA = await request('POST', '/api/users', {
      name: 'Customer A',
      email: 'customerA@example.com',
      password: 'Password123!',
      phone: '9876543210',
    });
    assert(regCustA.status === 201, 'Registers Customer A with valid data');
    const tokenA = regCustA.body.token;
    const userA_id = regCustA.body._id;
    assert(Boolean(tokenA), 'Customer A receives JWT authentication token');

    // Duplicate email registration rejection
    const dupEmailRes = await request('POST', '/api/users', {
      name: 'Customer A Duplicate',
      email: 'customera@example.com', // test case-insensitivity
      password: 'Password123!',
    });
    assert(dupEmailRes.status === 400, 'Rejects duplicate email registration (case-insensitive)');

    // Valid Customer B registration
    const regCustB = await request('POST', '/api/users', {
      name: 'Customer B',
      email: 'customerB@example.com',
      password: 'Password123!',
      phone: '9876543211',
    });
    assert(regCustB.status === 201, 'Registers Customer B with valid data');
    const tokenB = regCustB.body.token;

    // Create an Administrator
    const adminUser = await User.create({
      name: 'Store Admin',
      email: 'admin_test@keerticouture.com',
      password: 'AdminPassword123!',
      isAdmin: true,
    });
    const adminLoginRes = await request('POST', '/api/users/login', {
      email: 'admin_test@keerticouture.com',
      password: 'AdminPassword123!',
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.body.isAdmin === true, 'Admin logs in successfully with isAdmin: true');
    const tokenAdmin = adminLoginRes.body.token;

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 3: IDOR Security on GET /api/orders/:id
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: IDOR Security Checks on GET /api/orders/:id ---');

    // Create sample design for order reference
    const design = await Design.create({
      name: 'Bridal Zardosi Blouse',
      category: 'Bridal Blouse',
      price: 6000,
      neckStyle: 'Sweetheart',
      sleeveType: 'Short',
      backDesign: 'Deep U',
      images: [{ url: 'https://images.unsplash.com/sample.jpg', public_id: 'sample_id' }],
    });

    // Customer A creates Order A
    const createOrderRes = await request(
      'POST',
      '/api/orders',
      {
        customerName: 'Customer A',
        phone: '9876543210',
        design: design._id,
        customizationOptions: { neckStyle: 'Sweetheart', fabricColor: 'Rose' },
        measurements: { bust: 36, waist: 30, shoulder: 14.5 },
        totalPrice: 6000,
        paymentMethod: 'PayOnline',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(createOrderRes.status === 201, 'Customer A creates Order A');
    const orderA_id = createOrderRes.body.order._id;

    // ATTACK ATTEMPT: Customer B attempts to access Customer A's order
    const idorAttackRes = await request(
      'GET',
      `/api/orders/${orderA_id}`,
      null,
      { Authorization: `Bearer ${tokenB}` }
    );
    assert(
      idorAttackRes.status === 403,
      '[SEC-01 IDOR FIX] Customer B is rejected with 403 Forbidden when requesting Customer A order',
      `Got status: ${idorAttackRes.status}`
    );

    // Unauthenticated request attempt
    const unauthOrderRes = await request('GET', `/api/orders/${orderA_id}`);
    assert(unauthOrderRes.status === 401, 'Unauthenticated user rejected with 401 Unauthorized');

    // Legitimate owner (Customer A) accesses their own order
    const ownerGetRes = await request(
      'GET',
      `/api/orders/${orderA_id}`,
      null,
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(ownerGetRes.status === 200, 'Customer A can view their own order (200 OK)');
    assert(ownerGetRes.body.customerName === 'Customer A', 'Customer A order details match');

    // Administrator accesses Customer A's order
    const adminGetRes = await request(
      'GET',
      `/api/orders/${orderA_id}`,
      null,
      { Authorization: `Bearer ${tokenAdmin}` }
    );
    assert(adminGetRes.status === 200, 'Administrator can view Customer A order for fulfillment (200 OK)');

    // Invalid ObjectId format
    const badIdRes = await request(
      'GET',
      '/api/orders/not-a-valid-id',
      null,
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(badIdRes.status === 400, 'Invalid order ID format rejected with 400 Bad Request');

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 4: Unauthorized Order Payment Tampering on PUT /api/orders/:id/pay
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: Payment Route Protection (PUT /api/orders/:id/pay) ---');

    // Customer A attempts to mark their own order as paid directly via /pay
    const custPayRes = await request(
      'PUT',
      `/api/orders/${orderA_id}/pay`,
      { id: 'fake_payment_id', status: 'COMPLETED' },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(
      custPayRes.status === 403,
      '[SEC-02 FIX] Customer A is blocked from calling /pay (403 Forbidden: Admin only)',
      `Got status: ${custPayRes.status}`
    );

    // Customer B attempts to mark Customer A order as paid
    const custBPayRes = await request(
      'PUT',
      `/api/orders/${orderA_id}/pay`,
      { id: 'fake_payment_id', status: 'COMPLETED' },
      { Authorization: `Bearer ${tokenB}` }
    );
    assert(
      custBPayRes.status === 403,
      '[SEC-02 FIX] Customer B is blocked from calling /pay (403 Forbidden: Admin only)'
    );

    // Administrator uses /pay for manual verification
    const adminPayRes = await request(
      'PUT',
      `/api/orders/${orderA_id}/pay`,
      { id: 'admin_cash_receipt_101', status: 'COMPLETED' },
      { Authorization: `Bearer ${tokenAdmin}` }
    );
    assert(adminPayRes.status === 200 && adminPayRes.body.order.paymentStatus === 'Paid', 'Admin can manually verify payment via /pay');

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 5: Razorpay Payment Verification Security (POST /api/payments/verify)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 5: Razorpay Cryptographic Verification & Ownership ---');

    // Create a new unpaid Order for Customer A
    const order2Res = await request(
      'POST',
      '/api/orders',
      {
        customerName: 'Customer A',
        phone: '9876543210',
        design: design._id,
        totalPrice: 4000,
        paymentMethod: 'PayOnline',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    const order2_id = order2Res.body.order._id;
    const mockRzOrderId = `order_${Date.now()}`;
    const mockRzPaymentId = `pay_${Date.now()}`;

    // Generate valid HMAC signature
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${mockRzOrderId}|${mockRzPaymentId}`)
      .digest('hex');

    // ATTACK 1: Customer B attempts to submit verification for Customer A's order
    const crossVerifyRes = await request(
      'POST',
      '/api/payments/verify',
      {
        razorpayOrderId: mockRzOrderId,
        razorpayPaymentId: mockRzPaymentId,
        razorpaySignature: validSignature,
        orderId: order2_id,
        paymentType: 'full',
      },
      { Authorization: `Bearer ${tokenB}` }
    );
    assert(
      crossVerifyRes.status === 403,
      '[SEC-03 FIX] Cross-customer payment verification rejected with 403 Forbidden',
      `Got status: ${crossVerifyRes.status}`
    );

    // ATTACK 2: Invalid / forged HMAC signature
    const forgedVerifyRes = await request(
      'POST',
      '/api/payments/verify',
      {
        razorpayOrderId: mockRzOrderId,
        razorpayPaymentId: mockRzPaymentId,
        razorpaySignature: 'forged_fake_signature_abc123',
        orderId: order2_id,
        paymentType: 'full',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(forgedVerifyRes.status === 400, 'Forged HMAC signature rejected with 400 Bad Request');

    // Legitimate verification by Customer A
    const legitVerifyRes = await request(
      'POST',
      '/api/payments/verify',
      {
        razorpayOrderId: mockRzOrderId,
        razorpayPaymentId: mockRzPaymentId,
        razorpaySignature: validSignature,
        orderId: order2_id,
        paymentType: 'full',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(legitVerifyRes.status === 200, 'Legitimate payment verification succeeds with 200 OK');
    assert(legitVerifyRes.body.order.paymentStatus === 'Paid', 'Order paymentStatus updated to "Paid"');
    assert(legitVerifyRes.body.order.remainingAmount === 0, 'Remaining balance updated to 0');

    // IDEMPOTENCY TEST: Re-submitting the exact same verification
    const replayVerifyRes = await request(
      'POST',
      '/api/payments/verify',
      {
        razorpayOrderId: mockRzOrderId,
        razorpayPaymentId: mockRzPaymentId,
        razorpaySignature: validSignature,
        orderId: order2_id,
        paymentType: 'full',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(replayVerifyRes.status === 200, 'Replay verification is idempotent and returns 200 OK without errors');

    // DUPLICATE PAYMENT ID PROTECTION: Attacker tries to use Order 2's payment ID on Order 3
    const order3Res = await request(
      'POST',
      '/api/orders',
      {
        customerName: 'Customer A',
        phone: '9876543210',
        design: design._id,
        totalPrice: 5000,
        paymentMethod: 'PayOnline',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    const order3_id = order3Res.body.order._id;

    const dupPaymentIdRes = await request(
      'POST',
      '/api/payments/verify',
      {
        razorpayOrderId: mockRzOrderId,
        razorpayPaymentId: mockRzPaymentId, // Reusing Order 2's payment ID!
        razorpaySignature: validSignature,
        orderId: order3_id,
        paymentType: 'full',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(
      dupPaymentIdRes.status === 400 && dupPaymentIdRes.body.message.includes('applied to another order'),
      'Prevents reusing the same payment ID across different orders'
    );

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 6: Razorpay Webhook Signature Verification & Async Reconciliation
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 6: Razorpay Webhooks (POST /api/payments/webhook) ---');

    // Create Order 4 for webhook testing
    const order4Res = await request(
      'POST',
      '/api/orders',
      {
        customerName: 'Customer A',
        phone: '9876543210',
        design: design._id,
        totalPrice: 7500,
        paymentMethod: 'PayOnline',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    const order4 = await Order.findById(order4Res.body.order._id);
    const webhookRzOrderId = `order_wh_${Date.now()}`;
    const webhookRzPaymentId = `pay_wh_${Date.now()}`;
    order4.razorpayOrderId = webhookRzOrderId;
    await order4.save();

    // 1. Webhook missing signature header
    const noSigWebhookRes = await request('POST', '/api/payments/webhook', { event: 'payment.captured' });
    assert(noSigWebhookRes.status === 400, 'Webhook missing signature header rejected with 400 Bad Request');

    // 2. Webhook invalid signature
    const badSigWebhookRes = await request(
      'POST',
      '/api/payments/webhook',
      { event: 'payment.captured' },
      { 'x-razorpay-signature': 'invalid_signature_xyz' }
    );
    assert(badSigWebhookRes.status === 400, 'Webhook with forged signature rejected with 400 Bad Request');

    // 3. Valid payment.captured webhook payload
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: webhookRzPaymentId,
            order_id: webhookRzOrderId,
            amount: 750000,
            status: 'captured',
          }
        }
      }
    });

    const validWebhookSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookPayload)
      .digest('hex');

    const legitWebhookRes = await request(
      'POST',
      '/api/payments/webhook',
      webhookPayload,
      {
        'x-razorpay-signature': validWebhookSig,
        'Content-Type': 'application/json',
      }
    );
    assert(legitWebhookRes.status === 200, 'Valid payment.captured webhook returns 200 OK');

    const updatedOrder4 = await Order.findById(order4._id);
    assert(updatedOrder4.paymentStatus === 'Paid', 'Webhook successfully reconciled order paymentStatus to "Paid"');
    assert(updatedOrder4.razorpayPaymentId === webhookRzPaymentId, 'Webhook recorded correct razorpayPaymentId');

    // 4. Webhook idempotency test (re-sending identical webhook event)
    const duplicateWebhookRes = await request(
      'POST',
      '/api/payments/webhook',
      webhookPayload,
      {
        'x-razorpay-signature': validWebhookSig,
        'Content-Type': 'application/json',
      }
    );
    assert(duplicateWebhookRes.status === 200, 'Duplicate webhook event handled idempotently without error');

    // 5. Webhook payment.failed event
    const order5 = await Order.create({
      user: userA_id,
      customerName: 'Customer A',
      phone: '9876543210',
      design: design._id,
      totalPrice: 3000,
      paymentMethod: 'PayOnline',
      paymentStatus: 'Pending',
      razorpayOrderId: `order_fail_${Date.now()}`,
    });

    const failPayload = JSON.stringify({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: `pay_failed_${Date.now()}`,
            order_id: order5.razorpayOrderId,
            amount: 300000,
            status: 'failed',
          }
        }
      }
    });

    const failSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(failPayload)
      .digest('hex');

    const failWebhookRes = await request(
      'POST',
      '/api/payments/webhook',
      failPayload,
      {
        'x-razorpay-signature': failSig,
        'Content-Type': 'application/json',
      }
    );
    assert(failWebhookRes.status === 200, 'payment.failed webhook acknowledged with 200 OK');
    const failedOrder = await Order.findById(order5._id);
    assert(failedOrder.paymentStatus === 'Failed', 'Order paymentStatus updated to "Failed"');

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 7: Mongoose 9 Service Deletion Crash Fix
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 7: Mongoose 9 Runtime Compatibility ---');

    // Admin creates an extra service
    const createServiceRes = await request(
      'POST',
      '/api/services',
      {
        name: 'Tassel Embellishment',
        price: 350,
        description: 'Handmade luxury silk tassels',
        isActive: true,
      },
      { Authorization: `Bearer ${tokenAdmin}` }
    );
    assert(createServiceRes.status === 201, 'Admin creates service');
    const serviceId = createServiceRes.body._id;

    // Admin deletes the service (Previously crashed with service.remove is not a function)
    const deleteServiceRes = await request(
      'DELETE',
      `/api/services/${serviceId}`,
      null,
      { Authorization: `Bearer ${tokenAdmin}` }
    );
    assert(
      deleteServiceRes.status === 200,
      '[BUG-01 FIX] Service deleted successfully without Mongoose 9 service.remove() crash',
      `Got status: ${deleteServiceRes.status}`
    );

    const checkService = await Service.findById(serviceId);
    assert(checkService === null, 'Service confirmed deleted from MongoDB');

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 8: Order Retry Lifecycle (Preventing Duplicate Zombie Orders)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 8: Order Lifecycle & Duplicate Prevention ---');

    // Customer A initiates checkout
    const initialOrderRes = await request(
      'POST',
      '/api/orders',
      {
        customerName: 'Customer A',
        phone: '9876543210',
        design: design._id,
        totalPrice: 4500,
        paymentMethod: 'PayAdvance',
        advanceAmount: 300,
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(initialOrderRes.status === 201, 'Initial checkout attempt creates pending order');
    const existingOrderId = initialOrderRes.body.order._id;

    // User cancels Razorpay modal, changes mind to PayAtPickup, and retries with existing orderId
    const retryOrderRes = await request(
      'POST',
      '/api/orders',
      {
        orderId: existingOrderId,
        customerName: 'Customer A Updated',
        phone: '9876543210',
        design: design._id,
        totalPrice: 4500,
        paymentMethod: 'PayAtPickup',
      },
      { Authorization: `Bearer ${tokenA}` }
    );
    assert(retryOrderRes.status === 200, 'Retry checkout with orderId updates existing draft (200 OK)');
    assert(retryOrderRes.body.order._id === existingOrderId, 'Reuses identical Order ID rather than generating a duplicate');
    assert(retryOrderRes.body.order.paymentMethod === 'PayAtPickup', 'Order paymentMethod updated to PayAtPickup');

    const totalOrdersCustomerA = await Order.countDocuments({ user: userA_id, customerName: 'Customer A Updated' });
    assert(totalOrdersCustomerA === 1, 'Verified database contains exactly 1 order record (zero duplicate zombie orders)');

    // ─────────────────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n============================================================');
    console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
    console.log('============================================================\n');

    if (failedTests > 0) {
      console.error('Failure Details:');
      failures.forEach((f, idx) => {
        console.error(`  ${idx + 1}. ${f.testName}: ${f.details}`);
      });
      process.exit(1);
    } else {
      console.log('ALL PHASE 2 CRITICAL SECURITY & PAYMENT TESTS PASSED!\n');
    }
  } catch (err) {
    console.error('Fatal Test Suite Error:', err);
    process.exit(1);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
}

runAllTests();

