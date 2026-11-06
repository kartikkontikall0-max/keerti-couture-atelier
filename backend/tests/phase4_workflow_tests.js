/**
 * Keerti Couture — Phase 4 Business Workflows Verification Suite
 *
 * Covers:
 * 1. Appointment Booking Engine:
 *    - Valid booking (Guest & Authenticated)
 *    - Input validation (missing fields, invalid email, past date)
 *    - Slot Conflict Prevention (same date + slot returns 409)
 *    - Date / Slot independence (different slot or different date allowed)
 *    - Slot release upon cancellation
 *    - IDOR protection on GET /api/appointments/:id
 *    - Customer self-cancellation
 *    - Admin management: status update, conflict-aware rescheduling
 * 2. Custom Design Quotation Engine:
 *    - Quotation submission (Guest & Authenticated with reference images)
 *    - Validation & storage
 *    - Customer quotation retrieval
 *    - IDOR protection on GET /api/quotations/:id
 *    - Admin quotation provisioning (amount, turnaround, notes)
 *    - Customer response (Accept / Decline state transitions)
 *    - Invalid state transition prevention
 *    - Admin quotation management
 * 3. Admin Services Management:
 *    - Admin authorization guards (403 for non-admins)
 *    - Price and name validations (negative prices rejected)
 *    - Create, Get By ID, Update, Toggle Active, Delete
 *    - Public catalog active-only filtering
 * 4. Transactional Notification Engine:
 *    - Order confirmation, payment status, appointment and quotation email handlers
 *    - Resilience & safe error handling
 */

process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test_jwt_secret_antigravity_phase4_32_chars';
process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_key_id';
process.env.RAZORPAY_KEY_SECRET = 'rzp_test_mock_secret_key_12345';

const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const connectDB = require('../config/db');
const { disconnectDB } = require('../config/db');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Quotation = require('../models/Quotation');
const Service = require('../models/Service');
const {
  sendOrderConfirmationEmail,
  sendPaymentStatusEmail,
  sendAppointmentStatusEmail,
  sendQuotationUpdateEmail,
} = require('../utils/mailer');

let server;
let baseUrl;

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

async function runPhase4Tests() {
  console.log('\n============================================================');
  console.log('  KEERTI COUTURE — PHASE 4 COMPLETE BUSINESS WORKFLOW TESTS');
  console.log('============================================================\n');

  try {
    console.log('[Setup] Connecting to in-memory test database...');
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`[Setup] Test server running on ${baseUrl}\n`);

    // Clean data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Quotation.deleteMany({});
    await Service.deleteMany({});

    // ─────────────────────────────────────────────────────────────────────────
    // SETUP: Create Admin and Customer Users
    // ─────────────────────────────────────────────────────────────────────────
    console.log('--- SETUP: Initializing Test Users ---');
    
    // Customer 1
    const regCust1 = await request('POST', '/api/users', {
      name: 'Ananya Sharma',
      email: 'ananya@example.com',
      password: 'Password123!',
      phone: '+91 98765 43210',
    });
    assert(regCust1.status === 201, 'Customer 1 registered successfully');
    const cust1Token = regCust1.body.token;
    const cust1Headers = { Authorization: `Bearer ${cust1Token}` };

    // Customer 2
    const regCust2 = await request('POST', '/api/users', {
      name: 'Pooja Hegde',
      email: 'pooja@example.com',
      password: 'Password123!',
      phone: '+91 91234 56789',
    });
    assert(regCust2.status === 201, 'Customer 2 registered successfully');
    const cust2Token = regCust2.body.token;
    const cust2Headers = { Authorization: `Bearer ${cust2Token}` };

    // Administrator
    const adminUser = new User({
      name: 'Atelier Director',
      email: 'director@keerticouture.com',
      password: 'AdminPassword99!',
      phone: '+91 99999 88888',
      isAdmin: true,
    });
    await adminUser.save();

    const loginAdmin = await request('POST', '/api/users/login', {
      email: 'director@keerticouture.com',
      password: 'AdminPassword99!',
    });
    assert(loginAdmin.status === 200 && loginAdmin.body.isAdmin, 'Admin authenticated successfully');
    const adminToken = loginAdmin.body.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 1: Appointment Booking Engine & Conflict Prevention
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 1: Appointment Booking Engine & Conflict Prevention ---');

    // Generate upcoming dates (e.g. 5 days from now and 10 days from now)
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 5);
    const dateStr1 = futureDate1.toISOString().split('T')[0];

    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 10);
    const dateStr2 = futureDate2.toISOString().split('T')[0];

    // 1.1 Validation tests
    const missingNameAppt = await request('POST', '/api/appointments', {
      email: 'test@example.com',
      phone: '9876543210',
      preferredDate: dateStr1,
      timeSlot: '11:00 AM - 12:30 PM',
    });
    assert(missingNameAppt.status === 400, 'Rejects appointment booking with missing customer name');

    const invalidEmailAppt = await request('POST', '/api/appointments', {
      customerName: 'Maya Rao',
      email: 'invalid-email-format',
      phone: '9876543210',
      preferredDate: dateStr1,
      timeSlot: '11:00 AM - 12:30 PM',
    });
    assert(invalidEmailAppt.status === 400, 'Rejects appointment booking with invalid email format');

    const pastDateAppt = await request('POST', '/api/appointments', {
      customerName: 'Maya Rao',
      email: 'maya@example.com',
      phone: '9876543210',
      preferredDate: '2020-01-01',
      timeSlot: '11:00 AM - 12:30 PM',
    });
    assert(pastDateAppt.status === 400, 'Rejects appointment booking with past date');

    const missingSlotAppt = await request('POST', '/api/appointments', {
      customerName: 'Maya Rao',
      email: 'maya@example.com',
      phone: '9876543210',
      preferredDate: dateStr1,
    });
    assert(missingSlotAppt.status === 400, 'Rejects appointment booking with missing time slot');

    // 1.2 Legitimate Guest Booking
    const guestApptRes = await request('POST', '/api/appointments', {
      customerName: 'Guest Client',
      email: 'guest@example.com',
      phone: '+91 98888 77777',
      preferredDate: dateStr1,
      timeSlot: '02:00 PM - 03:30 PM',
      consultType: 'In-Store Atelier Fitting',
      notes: 'Need bridal blouse fitting',
    });
    assert(guestApptRes.status === 201, 'Guest client books appointment successfully');
    assert(guestApptRes.body.appointment.status === 'Pending', 'Guest appointment created with status Pending');
    assert(!guestApptRes.body.appointment.user, 'Guest appointment has no attached user ID');

    // 1.3 Authenticated Customer 1 Booking
    const cust1ApptRes = await request('POST', '/api/appointments', {
      customerName: 'Ananya Sharma',
      email: 'ananya@example.com',
      phone: '+91 98765 43210',
      preferredDate: dateStr1,
      timeSlot: '11:00 AM - 12:30 PM',
      consultType: 'Bridal Trousseau Planning',
      notes: 'Three bespoke blouses for December reception',
    }, cust1Headers);
    assert(cust1ApptRes.status === 201, 'Authenticated Customer 1 books appointment successfully');
    assert(cust1ApptRes.body.appointment.user !== undefined, 'Customer appointment correctly links customer user ID');
    const cust1ApptId = cust1ApptRes.body.appointment._id;

    // 1.4 Conflict Prevention: Booking the SAME timeSlot on the SAME date
    const conflictRes = await request('POST', '/api/appointments', {
      customerName: 'Pooja Hegde',
      email: 'pooja@example.com',
      phone: '+91 91234 56789',
      preferredDate: dateStr1,
      timeSlot: '11:00 AM - 12:30 PM', // Same slot on dateStr1
      consultType: 'In-Store Atelier Fitting',
    }, cust2Headers);
    assert(conflictRes.status === 409, 'Conflict prevention rejects double-booking same date & slot with 409 Conflict');
    assert(conflictRes.body.message.includes('already booked'), 'Conflict error message informs user of unavailability');

    // 1.5 Conflict Independence: Different slot on same date succeeds
    const diffSlotRes = await request('POST', '/api/appointments', {
      customerName: 'Pooja Hegde',
      email: 'pooja@example.com',
      phone: '+91 91234 56789',
      preferredDate: dateStr1,
      timeSlot: '04:00 PM - 05:30 PM', // Different slot on same date
      consultType: 'WhatsApp Video Call',
    }, cust2Headers);
    assert(diffSlotRes.status === 201, 'Different time slot on the same date succeeds');
    const cust2ApptId = diffSlotRes.body.appointment._id;

    // 1.6 Conflict Independence: Same slot on different date succeeds
    const diffDateRes = await request('POST', '/api/appointments', {
      customerName: 'Pooja Hegde',
      email: 'pooja@example.com',
      phone: '+91 91234 56789',
      preferredDate: dateStr2, // Different date
      timeSlot: '11:00 AM - 12:30 PM', // Same slot as Customer 1
      consultType: 'In-Store Atelier Fitting',
    }, cust2Headers);
    assert(diffDateRes.status === 201, 'Same time slot on a different date succeeds');

    // 1.7 Customer Retrieval & IDOR Access Control
    const myApptsRes = await request('GET', '/api/appointments/my', null, cust1Headers);
    assert(myApptsRes.status === 200, 'Customer 1 retrieves their appointments');
    assert(Array.isArray(myApptsRes.body.appointments) && myApptsRes.body.appointments.length >= 1, 'Customer 1 appointment list populated');

    // IDOR Check: Customer 2 attempting to view Customer 1 appointment
    const idorApptRes = await request('GET', `/api/appointments/${cust1ApptId}`, null, cust2Headers);
    assert(idorApptRes.status === 403, 'IDOR Guard: Customer 2 blocked from viewing Customer 1 appointment (403 Forbidden)');

    // Customer 1 viewing own appointment
    const selfApptRes = await request('GET', `/api/appointments/${cust1ApptId}`, null, cust1Headers);
    assert(selfApptRes.status === 200, 'Customer 1 can view their own appointment');

    // Admin viewing Customer 1 appointment
    const adminApptViewRes = await request('GET', `/api/appointments/${cust1ApptId}`, null, adminHeaders);
    assert(adminApptViewRes.status === 200, 'Admin can view Customer 1 appointment for studio management');

    // Invalid & Nonexistent IDs
    const badIdRes = await request('GET', '/api/appointments/invalid-id-format', null, adminHeaders);
    assert(badIdRes.status === 400, 'Rejects malformed appointment ID with 400 Bad Request');

    const nonExistId = new mongoose.Types.ObjectId();
    const notFoundRes = await request('GET', `/api/appointments/${nonExistId}`, null, adminHeaders);
    assert(notFoundRes.status === 404, 'Non-existent appointment ID returns 404 Not Found');

    // 1.8 Customer Self-Cancellation & Slot Freeing
    // Customer 2 attempts to cancel Customer 1's appointment -> 403
    const illegalCancelRes = await request('PUT', `/api/appointments/${cust1ApptId}/cancel`, {}, cust2Headers);
    assert(illegalCancelRes.status === 403, 'Customer 2 forbidden from cancelling Customer 1 appointment');

    // Customer 1 cancels their own appointment
    const cancelApptRes = await request('PUT', `/api/appointments/${cust1ApptId}/cancel`, {}, cust1Headers);
    assert(cancelApptRes.status === 200, 'Customer 1 cancels their own appointment successfully');
    assert(cancelApptRes.body.appointment.status === 'Cancelled', 'Appointment status transitioned to Cancelled');

    // Verification: Now that slot is cancelled, another customer CAN book that same slot!
    const rebookSlotRes = await request('POST', '/api/appointments', {
      customerName: 'Pooja Hegde',
      email: 'pooja@example.com',
      phone: '+91 91234 56789',
      preferredDate: dateStr1,
      timeSlot: '11:00 AM - 12:30 PM', // Was previously booked by Customer 1
      consultType: 'In-Store Atelier Fitting',
    }, cust2Headers);
    assert(rebookSlotRes.status === 201, 'Freed slot can now be booked by another customer');
    const newCust2ApptId = rebookSlotRes.body.appointment._id;

    // 1.9 Admin Operations: Listing, Status Confirmation & Rescheduling
    // Non-admin blocked from admin list
    const unauthListRes = await request('GET', '/api/appointments', null, cust1Headers);
    assert(unauthListRes.status === 403, 'Non-admin blocked from listing all appointments (403 Forbidden)');

    // Admin lists appointments with filter
    const adminListRes = await request('GET', '/api/appointments?status=Pending', null, adminHeaders);
    assert(adminListRes.status === 200, 'Admin can list appointments');
    assert(adminListRes.body.appointments.every((a) => a.status === 'Pending'), 'Status filter correctly returns only Pending appointments');

    // Admin confirms appointment
    const confirmRes = await request('PUT', `/api/appointments/${newCust2ApptId}/status`, {
      status: 'Confirmed',
      adminNotes: 'Fitting room 1 reserved for Pooja',
    }, adminHeaders);
    assert(confirmRes.status === 200, 'Admin successfully confirms appointment');
    assert(confirmRes.body.appointment.status === 'Confirmed', 'Status updated to Confirmed');

    // Admin Rescheduling: Conflict detection on reschedule
    // Attempting to reschedule to an already occupied slot (guestAppt is at 02:00 PM - 03:30 PM on dateStr1)
    const conflictReschedRes = await request('PUT', `/api/appointments/${newCust2ApptId}/reschedule`, {
      preferredDate: dateStr1,
      timeSlot: '02:00 PM - 03:30 PM',
    }, adminHeaders);
    assert(conflictReschedRes.status === 409, 'Admin rescheduling prevents slot collision with 409 Conflict');

    // Admin Rescheduling: Valid open slot succeeds
    const validReschedRes = await request('PUT', `/api/appointments/${newCust2ApptId}/reschedule`, {
      preferredDate: dateStr2,
      timeSlot: '02:00 PM - 03:30 PM',
      adminNotes: 'Rescheduled to accommodate atelier bridal showcase',
    }, adminHeaders);
    assert(validReschedRes.status === 200, 'Admin successfully reschedules appointment to an open date & slot');
    assert(validReschedRes.body.appointment.status === 'Rescheduled', 'Appointment status transitioned to Rescheduled');

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 2: Custom Design Quotation Workflow
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 2: Custom Design Quotation Workflow ---');

    // 2.1 Validation tests
    const missingNotesQuote = await request('POST', '/api/quotations', {
      customerName: 'Ananya Sharma',
      email: 'ananya@example.com',
      phone: '+91 98765 43210',
    });
    assert(missingNotesQuote.status === 400, 'Rejects quotation request with missing design notes');

    // 2.2 Legitimate Guest Quotation
    const guestQuoteRes = await request('POST', '/api/quotations', {
      customerName: 'Kavita Menon',
      email: 'kavita@example.com',
      phone: '+91 97777 66666',
      preferredFabric: 'Raw Silk & Organza',
      estimatedBudget: '₹15,000 - ₹20,000',
      notes: 'Temple border embroidery with heavy zardozi handwork on sleeves',
      referenceImages: [
        { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c' },
      ],
    });
    assert(guestQuoteRes.status === 201, 'Guest submits custom design quotation request');
    assert(guestQuoteRes.body.quotation.status === 'Submitted', 'Quotation request created with status Submitted');
    assert(guestQuoteRes.body.quotation.referenceImages.length === 1, 'Reference image URL stored correctly');

    // 2.3 Authenticated Customer 1 Quotation
    const cust1QuoteRes = await request('POST', '/api/quotations', {
      customerName: 'Ananya Sharma',
      email: 'ananya@example.com',
      phone: '+91 98765 43210',
      preferredFabric: 'Pure Kanjeevaram Brocade',
      estimatedBudget: '₹25,000 - ₹35,000',
      notes: 'Deep sweetheart neckline, peacock motif hand embroidery, contrast maggam work',
      referenceImages: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb',
      ],
    }, cust1Headers);
    assert(cust1QuoteRes.status === 201, 'Customer 1 submits custom design quotation request');
    assert(cust1QuoteRes.body.quotation.user !== undefined, 'Quotation linked to customer account');
    assert(cust1QuoteRes.body.quotation.referenceImages.length === 2, 'String array reference images converted and stored');
    const cust1QuoteId = cust1QuoteRes.body.quotation._id;

    // 2.4 Customer My Quotations
    const myQuotesRes = await request('GET', '/api/quotations/my', null, cust1Headers);
    assert(myQuotesRes.status === 200, 'Customer 1 retrieves their quotation history');
    assert(myQuotesRes.body.quotations.some((q) => q._id === cust1QuoteId), 'Quotation history contains submitted request');

    // 2.5 IDOR Security Protection
    const idorQuoteRes = await request('GET', `/api/quotations/${cust1QuoteId}`, null, cust2Headers);
    assert(idorQuoteRes.status === 403, 'IDOR Guard: Customer 2 blocked from viewing Customer 1 quote (403 Forbidden)');

    const selfQuoteRes = await request('GET', `/api/quotations/${cust1QuoteId}`, null, cust1Headers);
    assert(selfQuoteRes.status === 200, 'Customer 1 can view their own quotation request');

    const adminQuoteViewRes = await request('GET', `/api/quotations/${cust1QuoteId}`, null, adminHeaders);
    assert(adminQuoteViewRes.status === 200, 'Admin can view Customer 1 quotation for cost estimation');

    // 2.6 Premature Customer Response Prevention
    // Customer cannot accept before admin provides quote!
    const earlyRespondRes = await request('PUT', `/api/quotations/${cust1QuoteId}/respond`, {
      action: 'accept',
    }, cust1Headers);
    assert(earlyRespondRes.status === 400, 'Customer cannot respond to quotation that has not been quoted yet');

    // 2.7 Admin Provides Quotation
    // Non-admin blocked
    const unauthQuoteRes = await request('PUT', `/api/quotations/${cust1QuoteId}/quote`, {
      quotedAmount: 28500,
    }, cust1Headers);
    assert(unauthQuoteRes.status === 403, 'Non-admin blocked from providing price quotation (403 Forbidden)');

    // Missing amount rejected
    const badAmountRes = await request('PUT', `/api/quotations/${cust1QuoteId}/quote`, {
      quotedAmount: -500,
      quotedTurnaround: '12 business days',
    }, adminHeaders);
    assert(badAmountRes.status === 400, 'Rejects negative quoted amount with 400 Bad Request');

    // Legitimate Admin Quote
    const adminQuoteSubmitRes = await request('PUT', `/api/quotations/${cust1QuoteId}/quote`, {
      quotedAmount: 28500,
      quotedTurnaround: '10 to 14 business days',
      adminNotes: 'Includes pure gold zari thread work and silk lining',
    }, adminHeaders);
    assert(adminQuoteSubmitRes.status === 200, 'Admin successfully provides official price quote');
    assert(adminQuoteSubmitRes.body.quotation.status === 'Quoted', 'Quotation status transitioned to Quoted');
    assert(adminQuoteSubmitRes.body.quotation.quotedAmount === 28500, 'Quoted amount recorded accurately');
    assert(adminQuoteSubmitRes.body.quotation.quotedTurnaround === '10 to 14 business days', 'Turnaround recorded accurately');

    // 2.8 Customer Response: Accept Workflow
    // Cross-customer response blocked
    const illegalRespondRes = await request('PUT', `/api/quotations/${cust1QuoteId}/respond`, {
      action: 'accept',
    }, cust2Headers);
    assert(illegalRespondRes.status === 403, 'Customer 2 blocked from responding to Customer 1 quotation');

    // Invalid action rejected
    const invalidActionRes = await request('PUT', `/api/quotations/${cust1QuoteId}/respond`, {
      action: 'maybe',
    }, cust1Headers);
    assert(invalidActionRes.status === 400, 'Rejects invalid action verb with 400 Bad Request');

    // Customer 1 accepts quote
    const acceptRes = await request('PUT', `/api/quotations/${cust1QuoteId}/respond`, {
      action: 'accept',
      customerResponseNotes: 'Price approved. Please send fabric collection timeline.',
    }, cust1Headers);
    assert(acceptRes.status === 200, 'Customer 1 successfully accepts quotation');
    assert(acceptRes.body.quotation.status === 'Accepted', 'Quotation status transitioned to Accepted');

    // Cannot respond again once Accepted
    const reAcceptRes = await request('PUT', `/api/quotations/${cust1QuoteId}/respond`, {
      action: 'decline',
    }, cust1Headers);
    assert(reAcceptRes.status === 400, 'Cannot change response once quotation is already Accepted');

    // 2.9 Customer Response: Decline Workflow
    // Submit second quote for Customer 2
    const cust2QuoteRes = await request('POST', '/api/quotations', {
      customerName: 'Pooja Hegde',
      email: 'pooja@example.com',
      phone: '+91 91234 56789',
      notes: 'Net saree blouse with stone work',
    }, cust2Headers);
    const cust2QuoteId = cust2QuoteRes.body.quotation._id;

    // Admin quotes Customer 2
    await request('PUT', `/api/quotations/${cust2QuoteId}/quote`, {
      quotedAmount: 18000,
      quotedTurnaround: '7 days',
    }, adminHeaders);

    // Customer 2 declines quote
    const declineRes = await request('PUT', `/api/quotations/${cust2QuoteId}/respond`, {
      action: 'decline',
      customerResponseNotes: 'Slightly above current budget, will revisit later.',
    }, cust2Headers);
    assert(declineRes.status === 200, 'Customer 2 successfully declines quotation');
    assert(declineRes.body.quotation.status === 'Declined', 'Quotation status transitioned to Declined');

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 3: Admin Services Management CRUD & Catalog Integrity
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 3: Admin Services Management CRUD & Catalog Integrity ---');

    // 3.1 Non-admin authorization guards
    const unauthCreateSvc = await request('POST', '/api/services', {
      name: 'Express Hand Embroidery',
      price: 2500,
    }, cust1Headers);
    assert(unauthCreateSvc.status === 403, 'Non-admin blocked from creating service (403 Forbidden)');

    // 3.2 Service Validation
    const missingNameSvc = await request('POST', '/api/services', {
      price: 2500,
    }, adminHeaders);
    assert(missingNameSvc.status === 400, 'Rejects service creation with missing name');

    const negativePriceSvc = await request('POST', '/api/services', {
      name: 'Express Hand Embroidery',
      price: -500,
    }, adminHeaders);
    assert(negativePriceSvc.status === 400, 'Rejects service creation with negative price');

    // 3.3 Admin Creates Service
    const createSvcRes = await request('POST', '/api/services', {
      name: 'Master Artisan Zardozi Embroidery',
      description: 'Intricate metallic bullion wire and French knot couture work',
      price: 4500,
      estimatedTurnaround: '5-7 business days',
      isActive: true,
    }, adminHeaders);
    assert(createSvcRes.status === 201, 'Admin creates service successfully');
    assert(createSvcRes.body.name === 'Master Artisan Zardozi Embroidery', 'Service name stored accurately');
    assert(createSvcRes.body.price === 4500, 'Service price stored accurately');
    assert(createSvcRes.body.estimatedTurnaround === '5-7 business days', 'Estimated turnaround stored accurately');
    const createdSvcId = createSvcRes.body._id;

    // 3.4 Get Service By ID
    const getSvcRes = await request('GET', `/api/services/${createdSvcId}`);
    assert(getSvcRes.status === 200, 'Retrieves service by ID successfully');
    assert(getSvcRes.body._id === createdSvcId, 'Retrieved service ID matches');

    // 3.5 Admin Updates Service
    const unauthUpdateSvc = await request('PUT', `/api/services/${createdSvcId}`, {
      price: 5000,
    }, cust1Headers);
    assert(unauthUpdateSvc.status === 403, 'Non-admin blocked from updating service');

    const updateSvcRes = await request('PUT', `/api/services/${createdSvcId}`, {
      name: 'Master Artisan Royal Zardozi Embroidery',
      price: 5200,
      estimatedTurnaround: '6-8 business days',
      isActive: true,
    }, adminHeaders);
    assert(updateSvcRes.status === 200, 'Admin updates service successfully');
    assert(updateSvcRes.body.price === 5200, 'Updated price reflected');
    assert(updateSvcRes.body.name === 'Master Artisan Royal Zardozi Embroidery', 'Updated name reflected');

    // 3.6 Active-Only Filter Check
    // Deactivate service
    await request('PUT', `/api/services/${createdSvcId}`, {
      isActive: false,
    }, adminHeaders);

    const activeListRes = await request('GET', '/api/services?activeOnly=true');
    assert(activeListRes.status === 200, 'Public fetches active-only services');
    assert(!activeListRes.body.some((s) => s._id === createdSvcId), 'Deactivated service excluded from activeOnly listings');

    // Reactivate for deletion test
    await request('PUT', `/api/services/${createdSvcId}`, {
      isActive: true,
    }, adminHeaders);

    // 3.7 Admin Deletes Service
    const unauthDeleteSvc = await request('DELETE', `/api/services/${createdSvcId}`, null, cust1Headers);
    assert(unauthDeleteSvc.status === 403, 'Non-admin blocked from deleting service');

    const deleteSvcRes = await request('DELETE', `/api/services/${createdSvcId}`, null, adminHeaders);
    assert(deleteSvcRes.status === 200, 'Admin deletes service successfully');

    // Verify deletion in DB
    const verifyDelSvc = await Service.findById(createdSvcId);
    assert(verifyDelSvc === null, 'Service permanently removed from MongoDB');

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 4: Transactional Mailer Engine & Template Rendering
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- SUITE 4: Transactional Mailer Engine & Template Rendering ---');

    // 4.1 Order Confirmation Email
    const dummyOrder = {
      _id: new mongoose.Types.ObjectId(),
      totalPrice: 12500,
      shippingAddress: {
        fullName: 'Ananya Sharma',
        city: 'Bengaluru',
      },
      orderItems: [
        {
          name: 'The Royal Brocade Blouse',
          price: 9500,
          quantity: 1,
        },
      ],
      user: {
        name: 'Ananya Sharma',
        email: 'ananya@example.com',
      },
    };

    let orderEmailOk = false;
    try {
      const result = await sendOrderConfirmationEmail(dummyOrder);
      orderEmailOk = result && result.success;
    } catch (err) {
      console.error('Order email error:', err);
    }
    assert(orderEmailOk, 'sendOrderConfirmationEmail dispatches without error in test environment');

    // 4.2 Payment Status Email
    let paymentEmailOk = false;
    try {
      const result = await sendPaymentStatusEmail(dummyOrder, 'Paid', 'pay_mock_test_123');
      paymentEmailOk = result && result.success;
    } catch (err) {
      console.error('Payment email error:', err);
    }
    assert(paymentEmailOk, 'sendPaymentStatusEmail dispatches without error in test environment');

    // 4.3 Appointment Status Email
    const dummyAppt = {
      _id: new mongoose.Types.ObjectId(),
      customerName: 'Ananya Sharma',
      email: 'ananya@example.com',
      preferredDate: new Date(),
      timeSlot: '11:00 AM - 12:30 PM',
      consultType: 'Bridal Trousseau Planning',
      status: 'Confirmed',
    };

    let apptEmailOk = false;
    try {
      const result = await sendAppointmentStatusEmail(dummyAppt, 'Confirmed');
      apptEmailOk = result && result.success;
    } catch (err) {
      console.error('Appointment email error:', err);
    }
    assert(apptEmailOk, 'sendAppointmentStatusEmail dispatches without error in test environment');

    // 4.4 Quotation Update Email
    const dummyQuotation = {
      _id: new mongoose.Types.ObjectId(),
      customerName: 'Ananya Sharma',
      email: 'ananya@example.com',
      quotedAmount: 28500,
      quotedTurnaround: '10 to 14 business days',
      status: 'Quoted',
    };

    let quoteEmailOk = false;
    try {
      const result = await sendQuotationUpdateEmail(dummyQuotation, 'quoted');
      quoteEmailOk = result && result.success;
    } catch (err) {
      console.error('Quotation email error:', err);
    }
    assert(quoteEmailOk, 'sendQuotationUpdateEmail dispatches without error in test environment');

    // ─────────────────────────────────────────────────────────────────────────
    // SUMMARY
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n============================================================');
    console.log(`  PHASE 4 TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
    console.log('============================================================\n');

    if (failedTests > 0) {
      console.error('FAILED TESTS:');
      failures.forEach((f) => console.error(`  - ${f.testName}: ${f.details}`));
      process.exit(1);
    } else {
      console.log('ALL PHASE 4 BUSINESS WORKFLOW TESTS PASSED PERFECTLY!\n');
    }
  } catch (error) {
    console.error('Unhandled test suite error:', error);
    process.exit(1);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
}

runPhase4Tests();
