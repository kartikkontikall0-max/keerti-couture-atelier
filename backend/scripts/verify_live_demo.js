/**
 * Keerti Couture — Live Demo Functional Verification Suite
 * Executes end-to-end verification against the LIVE running backend & frontend servers.
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:3000';

const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function record(name, passed, details = '') {
  if (passed) {
    results.passed++;
    console.log(`  ✓ PASS: ${name} ${details ? `(${details})` : ''}`);
  } else {
    results.failed++;
    console.error(`  ✗ FAIL: ${name} ${details ? `(${details})` : ''}`);
  }
  results.tests.push({ name, passed, details });
}

async function runLiveVerification() {
  console.log('\n╔═════════════════════════════════════════════════════════════╗');
  console.log('║       KEERTI COUTURE — LIVE FUNCTIONAL VERIFICATION         ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  let customerToken = '';
  let adminToken = '';
  let sampleDesignId = '';
  let sampleServiceId = '';
  let createdOrderId = '';
  let createdAppointmentId = '';
  let createdQuotationId = '';

  // ── 1. Backend Health & Connectivity ─────────────────────────────────────
  console.log('1. Backend Server & Health Check');
  try {
    const res = await axios.get(`${API_BASE}/health`);
    record('Backend Health Endpoint', res.status === 200 && res.data.status === 'healthy', `DB: ${res.data.database}`);
  } catch (err) {
    record('Backend Health Endpoint', false, err.message);
  }

  // ── 2. Customer Authentication ───────────────────────────────────────────
  console.log('\n2. Customer Authentication & Profile');
  try {
    const res = await axios.post(`${API_BASE}/users/login`, {
      email: 'priya.sharma@example.demo',
      password: 'DemoCustomer@2026',
    });
    customerToken = res.data.token;
    record('Customer Login', !!customerToken, `Logged in as: ${res.data.name}`);
  } catch (err) {
    record('Customer Login', false, err.response?.data?.message || err.message);
  }

  if (customerToken) {
    try {
      const res = await axios.get(`${API_BASE}/users/profile`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      record('Customer Profile Fetch', res.status === 200 && res.data.email === 'priya.sharma@example.demo');
    } catch (err) {
      record('Customer Profile Fetch', false, err.message);
    }
  }

  // ── 3. Customer Registration (Idempotent new account) ─────────────────────
  console.log('\n3. Customer Registration');
  try {
    const testRegEmail = `test.patron.${Date.now()}@example.demo`;
    const res = await axios.post(`${API_BASE}/users`, {
      name: 'Aditi Rao',
      email: testRegEmail,
      password: 'DemoCustomer@2026',
      phone: '9880011223',
    });
    record('Customer Registration', res.status === 201 && !!res.data.token, `Created user: ${testRegEmail}`);
  } catch (err) {
    record('Customer Registration', false, err.response?.data?.message || err.message);
  }

  // ── 4. Admin Authentication & User Management ────────────────────────────
  console.log('\n4. Admin Authentication & Role Authorization');
  try {
    const res = await axios.post(`${API_BASE}/users/login`, {
      email: 'admin@keerticouture.com',
      password: 'AdminP@ssw0rd2026!',
    });
    adminToken = res.data.token;
    record('Admin Login', res.data.isAdmin === true, `Admin: ${res.data.name}`);
  } catch (err) {
    // Fallback to admin@keerticouture.demo
    try {
      const res2 = await axios.post(`${API_BASE}/users/login`, {
        email: 'admin@keerticouture.demo',
        password: 'DemoAdmin@2026',
      });
      adminToken = res2.data.token;
      record('Admin Login (demo)', res2.data.isAdmin === true, `Admin: ${res2.data.name}`);
    } catch (err2) {
      record('Admin Login', false, err2.response?.data?.message || err2.message);
    }
  }

  if (adminToken) {
    try {
      const res = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      record('Admin List Users', Array.isArray(res.data) && res.data.length >= 5, `Total users: ${res.data.length}`);
    } catch (err) {
      record('Admin List Users', false, err.message);
    }
  }

  // ── 5. Product Catalog & Filtering ───────────────────────────────────────
  console.log('\n5. Product Catalog & Silhouettes');
  try {
    const res = await axios.get(`${API_BASE}/designs`);
    record('Catalog Fetch (30 designs)', Array.isArray(res.data) && res.data.length >= 30, `Total designs: ${res.data.length}`);
    if (res.data.length > 0) {
      sampleDesignId = res.data[0]._id;
      const bridal = res.data.filter(d => d.category === 'Bridal Blouse');
      record('Category Filter (Bridal)', bridal.length >= 5, `Found: ${bridal.length} bridal designs`);
    }
  } catch (err) {
    record('Catalog Fetch', false, err.message);
  }

  if (sampleDesignId) {
    try {
      const res = await axios.get(`${API_BASE}/designs/${sampleDesignId}`);
      const designObj = res.data.design || res.data;
      record('Single Design Fetch', res.status === 200 && designObj._id === sampleDesignId, designObj.name);
    } catch (err) {
      record('Single Design Fetch', false, err.message);
    }
  }

  // ── 6. Admin Design Management ───────────────────────────────────────────
  console.log('\n6. Admin Design Management (CRUD)');
  let testCreatedDesignId = '';
  if (adminToken) {
    try {
      const res = await axios.post(`${API_BASE}/designs`, {
        name: 'Royal Heritage Brocade',
        category: 'Silk Blouse',
        price: 4500,
        neckStyle: 'Sweetheart',
        sleeveType: 'Elbow Length',
        backDesign: 'Deep U Back',
        description: 'Exquisite custom tailored brocade blouse piece with golden zari embroidery.',
        images: [{ url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' }],
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      testCreatedDesignId = res.data._id;
      record('Admin Create Design', res.status === 201 && !!res.data._id, res.data.name);
    } catch (err) {
      record('Admin Create Design', false, err.response?.data?.message || err.message);
    }

    if (testCreatedDesignId) {
      try {
        const res = await axios.put(`${API_BASE}/designs/${testCreatedDesignId}`, {
          price: 4800,
          description: 'Updated luxury description for bridal showcase.',
        }, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        record('Admin Update Design', res.data.price === 4800, `Updated price: ₹${res.data.price}`);
      } catch (err) {
        record('Admin Update Design', false, err.message);
      }
    }
  }

  // ── 7. Atelier Services ──────────────────────────────────────────────────
  console.log('\n7. Atelier Extra Services');
  try {
    const res = await axios.get(`${API_BASE}/services`);
    record('Fetch Services (10 services)', Array.isArray(res.data) && res.data.length >= 10, `Total services: ${res.data.length}`);
    if (res.data.length > 0) {
      sampleServiceId = res.data[0]._id;
    }
  } catch (err) {
    record('Fetch Services', false, err.message);
  }

  // ── 8. Order Placement & Lifecycle ───────────────────────────────────────
  console.log('\n8. Order Placement & Lifecycle (Customer & Admin)');
  if (customerToken && sampleDesignId) {
    try {
      const res = await axios.post(`${API_BASE}/orders`, {
        design: sampleDesignId,
        customerName: 'Priya Sharma',
        phone: '9900112233',
        customizationOptions: {
          neckStyle: 'Sweetheart',
          sleeveType: 'Elbow Length',
          backDesign: 'Keyhole with Tassel',
          fabricColor: 'Deep Crimson Red',
          paddingOption: 'Yes',
          liningOption: 'Cotton Voile',
          embroideryOption: 'Zardosi Work',
        },
        measurements: {
          bust: 36,
          waist: 30,
          shoulder: 14.5,
          armhole: 15,
          sleeveLength: 11,
          blouseLength: 15,
          frontNeckDepth: 6.5,
          backNeckDepth: 9.5,
        },
        extraServices: [
          { serviceId: String(sampleServiceId), name: 'Zari / Zardosi Embroidery', price: 1500 },
        ],
        totalPrice: 6500,
        paymentMethod: 'PayAtPickup',
      }, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      createdOrderId = res.data.order?._id || res.data._id;
      record('Customer Order Placement', res.status === 201 && !!createdOrderId, `Order #${createdOrderId}`);
    } catch (err) {
      record('Customer Order Placement', false, err.response?.data?.message || err.message);
    }
  }

  if (customerToken && createdOrderId) {
    try {
      const res = await axios.get(`${API_BASE}/orders/${createdOrderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      record('Customer Fetch Order By ID', res.status === 200 && res.data._id === createdOrderId, `Status: ${res.data.status}`);
    } catch (err) {
      record('Customer Fetch Order By ID', false, err.message);
    }

    try {
      const res = await axios.get(`${API_BASE}/orders/myorders`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      record('Customer List My Orders', Array.isArray(res.data) && res.data.length >= 1, `Found ${res.data.length} orders`);
    } catch (err) {
      record('Customer List My Orders', false, err.message);
    }
  }

  // ── 9. Payment Verification (Simulated HMAC verification) ────────────────
  console.log('\n9. Payment Gateway Verification (Cryptographic HMAC)');
  if (customerToken && createdOrderId) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'test_webhook_secret_key_123';
    const razorpayOrderId = `order_sim_${Date.now()}`;
    const razorpayPaymentId = `pay_sim_${Date.now()}`;
    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const razorpaySignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    try {
      const res = await axios.post(`${API_BASE}/payments/verify`, {
        orderId: createdOrderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentType: 'full',
      }, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      record('Payment Signature Verification', res.data.success === true && res.data.order.paymentStatus === 'Paid', `Payment ID: ${razorpayPaymentId}`);
    } catch (err) {
      record('Payment Signature Verification', false, err.response?.data?.message || err.message);
    }
  }

  // ── 10. Admin Order Status Updates ───────────────────────────────────────
  console.log('\n10. Admin Tailoring Stage Advancement');
  if (adminToken && createdOrderId) {
    try {
      const res = await axios.put(`${API_BASE}/orders/${createdOrderId}/status`, {
        status: 'Stitching started',
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      record('Admin Advance Order Status', res.data.status === 'Stitching started', `New status: ${res.data.status}`);
    } catch (err) {
      record('Admin Advance Order Status', false, err.response?.data?.message || err.message);
    }
  }

  // ── 11. Appointment Booking & Management ─────────────────────────────────
  console.log('\n11. Appointment Booking & Concurrency');
  const apptDate = new Date();
  apptDate.setDate(apptDate.getDate() + 35 + Math.floor(Math.random() * 60));
  const dateKey = apptDate.toISOString().split('T')[0];
  const timeSlots = ['10:00 AM - 11:30 AM', '11:30 AM - 01:00 PM', '02:00 PM - 03:30 PM', '03:30 PM - 05:00 PM'];
  const chosenSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

  try {
    const res = await axios.post(`${API_BASE}/appointments`, {
      customerName: 'Priya Sharma',
      email: 'priya.sharma@example.demo',
      phone: '9900112233',
      preferredDate: apptDate.toISOString(),
      dateKey,
      timeSlot: chosenSlot,
      consultType: 'In-Store Atelier Fitting',
      notes: 'Need measurements for bridal blouse with intricate cutwork.',
    }, {
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
    });
    createdAppointmentId = res.data.appointment?._id || res.data._id;
    record('Appointment Booking', res.status === 201 && !!createdAppointmentId, `Date: ${dateKey} Slot: ${chosenSlot}`);
  } catch (err) {
    record('Appointment Booking', false, err.response?.data?.message || err.message);
  }

  if (adminToken && createdAppointmentId) {
    try {
      const res = await axios.put(`${API_BASE}/appointments/${createdAppointmentId}/status`, {
        status: 'Confirmed',
        adminNotes: 'Confirmed fitting slot. Master tailor assigned.',
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      record('Admin Confirm Appointment', res.data.status === 'Confirmed', res.data.adminNotes);
    } catch (err) {
      record('Admin Confirm Appointment', false, err.message);
    }
  }

  // ── 12. Bespoke Design Quotations ────────────────────────────────────────
  console.log('\n12. Bespoke Custom Quotation Workflow');
  try {
    const res = await axios.post(`${API_BASE}/quotations`, {
      customerName: 'Priya Sharma',
      email: 'priya.sharma@example.demo',
      phone: '9900112233',
      preferredFabric: 'Pure Banarasi Katan Silk',
      estimatedBudget: '₹12,000 - ₹18,000',
      notes: 'Custom designer piece featuring antique zardosi floral borders, closed high neck, and potli button detailing.',
      referenceImages: [],
    }, {
      headers: customerToken ? { Authorization: `Bearer ${customerToken}` } : {},
    });
    createdQuotationId = res.data.quotation?._id || res.data._id;
    record('Customer Submit Quotation', res.status === 201 && !!createdQuotationId, `Quotation #${createdQuotationId}`);
  } catch (err) {
    record('Customer Submit Quotation', false, err.response?.data?.message || err.message);
  }

  if (adminToken && createdQuotationId) {
    try {
      const res = await axios.put(`${API_BASE}/quotations/${createdQuotationId}/quote`, {
        quotedAmount: 14500,
        quotedTurnaround: '18 Days',
        adminFeedback: 'We can source authentic Banarasi silk and handcraft this design with 2 master artisans.',
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      record('Admin Provide Quotation', res.data.status === 'Quoted' && res.data.quotedAmount === 14500, `Amount: ₹14,500`);
    } catch (err) {
      record('Admin Provide Quotation', false, err.message);
    }

    if (customerToken) {
      try {
        const res = await axios.put(`${API_BASE}/quotations/${createdQuotationId}/respond`, {
          action: 'Accepted',
          customerResponse: 'Agreed on the quotation! Excited to see the final piece.',
        }, {
          headers: { Authorization: `Bearer ${customerToken}` },
        });
        record('Customer Accept Quotation', res.data.status === 'Accepted', res.data.customerResponse);
      } catch (err) {
        record('Customer Accept Quotation', false, err.message);
      }
    }
  }

  // ── 13. Frontend Route Availability Check ────────────────────────────────
  console.log('\n13. Frontend UI Routes Availability');
  const frontendRoutes = [
    '/',
    '/designs',
    '/categories',
    '/about',
    '/contact',
    '/login',
    '/register',
    '/how-to-measure',
    '/services',
    '/admin',
    '/admin/dashboard',
    '/admin/designs',
    '/admin/orders',
    '/admin/appointments',
    '/admin/quotations',
    '/admin/services',
  ];

  for (const route of frontendRoutes) {
    try {
      const res = await axios.get(`${FRONTEND_BASE}${route}`, { timeout: 8000 });
      record(`UI Route [${route}]`, res.status === 200, `HTTP ${res.status}`);
    } catch (err) {
      record(`UI Route [${route}]`, false, err.message);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n╔═════════════════════════════════════════════════════════════╗');
  console.log(`║   VERIFICATION RESULTS: ${results.passed} PASSED / ${results.failed} FAILED             ║`);
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  if (results.failed === 0) {
    console.log('🎉 ALL FUNCTIONAL AND INTEGRATION TESTS PASSED CLEANLY ON LIVE SERVERS!');
  } else {
    console.error(`⚠️  ${results.failed} test(s) failed. Please review the output above.`);
  }

  return results;
}

runLiveVerification().catch(err => {
  console.error('Fatal suite runner error:', err);
  process.exit(1);
});
