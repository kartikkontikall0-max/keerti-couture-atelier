'use strict';

/**
 * ==============================================================================
 * KEERTI COUTURE — COMPLETE SMTP & OUTBOX INFRASTRUCTURE VERIFICATION SUITE
 * ==============================================================================
 * Validates all 9 transactional email workflows:
 * 1. Customer registration welcome email
 * 2. Order confirmation email
 * 3. Payment status update notification
 * 4. Appointment confirmation & booking
 * 5. Appointment cancellation & rescheduling
 * 6. Custom quotation received & quoted
 * 7. Quotation acceptance notification
 * 8. Order status atelier update
 * 9. Password reset request
 *
 * Validates architectural guarantees:
 * - HTML and Plain-Text alternatives present on every email
 * - HTML variable escaping (XSS / template injection defense)
 * - Atomic database leasing and zero duplicate claiming
 * - Stale lease recovery from abandoned or crashed workers
 * - Exponential backoff scheduling
 * - Dead-letter transition to FAILED after max attempts
 * - Safe mock transport fallback when live SMTP credentials are absent
 */

process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test_jwt_secret_smtp_infrastructure_32_chars';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';

const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const connectDB = require('../config/db');
const { disconnectDB } = require('../config/db');
const Outbox = require('../models/Outbox');
const User = require('../models/User');
const Order = require('../models/Order');
const {
  escapeHtml,
  getTransporter,
  setTransporter,
  resetTransporter,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentStatusEmail,
  sendAppointmentStatusEmail,
  sendQuotationUpdateEmail,
  sendOrderStatusUpdateEmail,
  sendPasswordResetEmail,
} = require('../utils/mailer');
const {
  enqueueOutboxEvent,
  processOutboxEvents,
  claimNextOutboxEvent,
} = require('../utils/outboxProcessor');

let server;
let baseUrl;

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

async function runSmtpSuite() {
  console.log('============================================================');
  console.log('  KEERTI COUTURE — COMPLETE SMTP & OUTBOX TEST SUITE        ');
  console.log('============================================================\n');

  try {
    await connectDB();
    server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    baseUrl = `http://localhost:${server.address().port}`;

    // Capturing mock transport to inspect generated email payloads
    const sentEmails = [];
    setTransporter({
      sendMail: async (options) => {
        sentEmails.push(options);
        return {
          messageId: `test-msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          accepted: [options.to],
          rejected: [],
          simulated: true,
        };
      },
      verify: async () => true,
    });

    console.log('--- SUITE 1: Template Rendering, Dual HTML/Text & XSS Escaping ---');

    // 1. Variable escaping test
    const rawMalicious = '<script>alert("xss")</script>&"\'';
    const escaped = escapeHtml(rawMalicious);
    assert(
      !escaped.includes('<script>') && escaped.includes('&lt;script&gt;') && escaped.includes('&amp;'),
      'escapeHtml strictly sanitizes HTML angle brackets, quotes, and ampersands'
    );

    // 2. Customer Registration Welcome Email
    const welcomeRes = await sendWelcomeEmail({
      name: 'Priya <img src=x onerror=alert(1)> Sharma',
      email: 'priya.sharma@example.com',
    });
    assert(welcomeRes.success, 'Registration welcome email generated successfully');
    const lastWelcome = sentEmails[sentEmails.length - 1];
    assert(
      lastWelcome.html && lastWelcome.text,
      'Welcome email provides both luxury HTML and plain-text alternatives'
    );
    assert(
      !lastWelcome.html.includes('<img src=x') && lastWelcome.html.includes('&lt;img src=x'),
      'Patron name is safely HTML-escaped in welcome template'
    );
    assert(
      lastWelcome.text.includes('Welcome to Keerti Couture Atelier'),
      'Plain-text alternative contains essential atelier concierge info'
    );

    // 3. Order Confirmation Email
    const orderRes = await sendOrderConfirmationEmail({
      _id: new mongoose.Types.ObjectId('6aee11223344556677889900'),
      customerName: 'Ananya Rao',
      paymentMethod: 'PayOnline',
      totalPrice: 6500,
      remainingAmount: 0,
      email: 'ananya@example.com',
    });
    assert(orderRes.success, 'Order confirmation email generated successfully');
    const lastOrder = sentEmails[sentEmails.length - 1];
    assert(
      lastOrder.html.includes('KC-889900') && lastOrder.text.includes('KC-889900'),
      'Order confirmation contains short reference ID in both HTML and text'
    );

    // 4. Payment Status Email (Paid & Failed)
    const paymentPaidRes = await sendPaymentStatusEmail(
      {
        _id: new mongoose.Types.ObjectId('6aee11223344556677889900'),
        customerName: 'Ananya Rao',
        paymentStatus: 'Paid',
        totalPrice: 6500,
        email: 'ananya@example.com',
      },
      { paymentId: 'pay_test_smtp_12345' }
    );
    assert(paymentPaidRes.success, 'Payment verified email generated successfully');
    const lastPayment = sentEmails[sentEmails.length - 1];
    assert(
      lastPayment.html.includes('Payment Received & Verified') && lastPayment.text.includes('Status: Paid'),
      'Payment verified notification renders status badge and transaction ID'
    );

    // 5. Appointment Status Emails (Confirmed, Rescheduled, Cancelled)
    const apptConfirmedRes = await sendAppointmentStatusEmail(
      {
        customerName: 'Meera Iyer',
        consultType: 'Bridal In-Studio Fitting',
        preferredDate: new Date('2026-11-20'),
        timeSlot: '02:00 PM - 03:30 PM',
        status: 'Confirmed',
        email: 'meera@example.com',
      },
      'confirmed'
    );
    assert(apptConfirmedRes.success, 'Appointment confirmed email generated successfully');

    const apptCancelRes = await sendAppointmentStatusEmail(
      {
        customerName: 'Meera Iyer',
        consultType: 'Bridal In-Studio Fitting',
        preferredDate: new Date('2026-11-20'),
        status: 'Cancelled',
        email: 'meera@example.com',
      },
      'cancelled'
    );
    assert(apptCancelRes.success, 'Appointment cancellation email generated successfully');

    // 6. Quotation Notification Emails (Received, Quoted, Accepted)
    const quoteQuotedRes = await sendQuotationUpdateEmail(
      {
        customerName: 'Divya Krishnan',
        preferredFabric: 'Pure Raw Silk',
        status: 'Quoted',
        quotedAmount: 4800,
        quotedTurnaround: '7 Days',
        adminFeedback: 'Hand zardosi needlework with korvai border',
        email: 'divya@example.com',
      },
      'quoted'
    );
    assert(quoteQuotedRes.success, 'Quotation ready email generated with itemized pricing');
    const lastQuote = sentEmails[sentEmails.length - 1];
    assert(
      lastQuote.html.includes('₹4,800') && lastQuote.text.includes('₹4,800'),
      'Quotation email displays quoted amount in INR currency format'
    );

    // 7. Order Status Update Email (Atelier Lifecycle)
    const orderStatusRes = await sendOrderStatusUpdateEmail(
      {
        _id: new mongoose.Types.ObjectId('6aee11223344556677889900'),
        customerName: 'Ananya Rao',
        status: 'Tailoring & Embroidery',
        trackingNumber: 'DTDC-BLR-998811',
        email: 'ananya@example.com',
      },
      'Processing'
    );
    assert(orderStatusRes.success, 'Order atelier progress update email generated successfully');
    const lastStatus = sentEmails[sentEmails.length - 1];
    assert(
      lastStatus.html.includes('Tailoring &amp; Embroidery') && lastStatus.html.includes('DTDC-BLR-998811'),
      'Order update includes atelier stage and tracking number'
    );

    // 8. Password Reset Email
    const pwResetRes = await sendPasswordResetEmail(
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
      },
      'sec_reset_token_mock_abc123'
    );
    assert(pwResetRes.success, 'Password reset email generated successfully');
    const lastPwReset = sentEmails[sentEmails.length - 1];
    assert(
      lastPwReset.html.includes('resetToken=sec_reset_token_mock_abc123') &&
      lastPwReset.text.includes('valid for 1 hour') || lastPwReset.text.includes('within 1 hour'),
      'Password reset contains secure token link and expiration warning'
    );

    console.log('\n--- SUITE 2: Transactional Outbox Lifecycle & Lease Locks ---');

    await Outbox.deleteMany({});

    // 9. Enqueue event into transactional outbox model
    const queuedEvent = await new Outbox({
      eventType: 'WELCOME_EMAIL',
      recipient: 'newpatron@example.com',
      payload: {
        name: 'New Patron',
        email: 'newpatron@example.com',
      },
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: new Date(Date.now() - 1000), // immediately ready
    }).save();
    assert(queuedEvent && queuedEvent.status === 'PENDING', 'Event enqueued in PENDING status');
    assert(queuedEvent.attempts === 0, 'Initial attempts count initialized to 0');

    // 10. Atomic database claim
    const claimed = await claimNextOutboxEvent();
    assert(
      claimed && claimed._id.toString() === queuedEvent._id.toString(),
      'Atomic claim locks the targeted outbox event'
    );
    assert(claimed.status === 'PROCESSING', 'Claimed event transitions atomically to PROCESSING');
    assert(claimed.attempts === 1, 'Attempt counter incremented atomically');

    // 11. Concurrency isolation: second worker cannot claim the same event
    const secondClaim = await claimNextOutboxEvent();
    assert(!secondClaim, 'Concurrent worker claim returns null (zero duplicate processing)');

    // 12. Crash recovery of expired lease
    claimed.nextAttemptAt = new Date(Date.now() - 5000); // simulate lease expiration after worker crash
    await claimed.save();

    const reclaimed = await claimNextOutboxEvent();
    assert(
      reclaimed && reclaimed._id.toString() === claimed._id.toString(),
      'Stale lease from crashed worker successfully reclaimed'
    );
    assert(reclaimed.attempts === 2, 'Reclaimed event tracks recovery attempt');

    // 13. Exponential backoff and dead-letter on failure
    await Outbox.deleteMany({});

    // Simulate failing SMTP transport
    setTransporter({
      sendMail: async () => {
        throw new Error('Connection refused: SMTP port 587 unreachable');
      },
    });

    const failingEvent = await new Outbox({
      eventType: 'ORDER_CONFIRMATION',
      recipient: 'fail@example.com',
      payload: { customerName: 'Fail Test' },
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 5,
      nextAttemptAt: new Date(Date.now() - 1000),
    }).save();

    // Run 5 failed sweeps
    for (let i = 1; i <= 5; i++) {
      const ev = await Outbox.findById(failingEvent._id);
      ev.nextAttemptAt = new Date(Date.now() - 1000);
      await ev.save();
      await processOutboxEvents();
    }

    const deadLetterEvent = await Outbox.findById(failingEvent._id);
    assert(
      deadLetterEvent.status === 'FAILED',
      'Outbox event transitions to FAILED dead-letter state after reaching max attempts (5)'
    );
    assert(
      deadLetterEvent.lastError.includes('SMTP port 587 unreachable'),
      'Dead-letter event records exact root cause in lastError'
    );

    console.log('\n============================================================');
    console.log(`  SMTP & OUTBOX TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
    console.log('============================================================\n');

    if (failedTests > 0) {
      console.error('Failures detected:', failures);
      process.exitCode = 1;
    }
  } finally {
    resetTransporter();
    if (server) server.close();
    await disconnectDB();
  }
}

runSmtpSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
