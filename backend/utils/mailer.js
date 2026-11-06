const nodemailer = require('nodemailer');

// ── HTML Variable Escaping Helper ───────────────────────────────────────────
const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// ── Transporter Setup ────────────────────────────────────────────────────────
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass && host !== 'smtp.your-email-provider.com') {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10000, // 10s timeout
      greetingTimeout: 5000,
    });
  } else {
    // Development / Test mode fallback
    transporter = {
      sendMail: async (mailOptions) => {
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[Mailer Mock] Email to: ${mailOptions.to} | Subject: "${mailOptions.subject}"`);
        }
        return {
          messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          accepted: [mailOptions.to],
          rejected: [],
          simulated: true,
        };
      },
      verify: async () => true,
    };
  }

  return transporter;
};

const setTransporter = (customTransporter) => {
  transporter = customTransporter;
};

const resetTransporter = () => {
  transporter = null;
};

// ── Retry Logic Helper ──────────────────────────────────────────────────────
const sendWithRetry = async (mailOptions, maxRetries = 2) => {
  const mailer = getTransporter();
  let attempts = 0;

  while (attempts <= maxRetries) {
    try {
      const info = await mailer.sendMail({
        from: process.env.FROM_EMAIL || '"Keerti Couture Atelier" <concierge@keerticouture.com>',
        ...mailOptions,
      });
      return { success: true, messageId: info.messageId, simulated: Boolean(info.simulated) };
    } catch (err) {
      attempts++;
      console.error(`[Mailer] Error sending email to ${mailOptions.to} (Attempt ${attempts}/${maxRetries + 1}):`, err.message);
      if (attempts > maxRetries) {
        return { success: false, error: err.message };
      }
      // Exponential backoff
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempts)));
    }
  }
};

// ── Luxury HTML Email Wrapper ───────────────────────────────────────────────
const getLuxuryEmailWrapper = (title, contentHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | Keerti Couture</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #2B2625; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #EFEAE4; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background-color: #1C1613; padding: 32px 24px; text-align: center; border-bottom: 2px solid #C5A059; }
    .header h1 { font-family: Georgia, serif; color: #E2C889; font-size: 26px; margin: 0; letter-spacing: 1px; }
    .header p { color: #FAF8F5; opacity: 0.8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 6px 0 0 0; }
    .content { padding: 32px 24px; }
    .card { background-color: #F8F5F1; border-radius: 12px; padding: 20px; border: 1px solid #EAE3DA; margin: 20px 0; }
    .footer { background-color: #FAF8F5; padding: 24px; text-align: center; font-size: 11px; color: #7F7775; border-top: 1px solid #EFEAE4; }
    .footer a { color: #8B2238; text-decoration: none; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .badge-paid { background-color: #E6F4EA; color: #137333; }
    .badge-pending { background-color: #FEF7E0; color: #B06000; }
    .badge-rose { background-color: #FBEAEF; color: #8B2238; }
    .btn { display: inline-block; background-color: #8B2238; color: #ffffff !important; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Keerti Couture</h1>
      <p>Bespoke Designer Blouse Atelier • Banhatti</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>Mangalwar Peth, Behind Shivanubhava Mantap, Banhatti, Karnataka — 587311</p>
      <p>Boutique Concierge: +91 80881 79166 | +91 99458 04019</p>
      <p>&copy; ${new Date().getFullYear()} Keerti Couture. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// ── 1. Customer Registration Welcome Email ──────────────────────────────────
const sendWelcomeEmail = async (user) => {
  const recipient = user.email;
  if (!recipient) return { success: false, error: 'No recipient email' };

  const safeName = escapeHtml(user.name || 'Valued Patron');

  const contentHtml = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">Welcome to Keerti Couture</h2>
    <p>Dear ${safeName},</p>
    <p>We are delighted to welcome you to the Keerti Couture family. Founded in the historic weaving heartland of Banhatti, Karnataka, our atelier blends centuries-old handloom heritage with bespoke contemporary tailoring.</p>

    <div class="card">
      <h3 style="font-family: Georgia, serif; color: #8B2238; font-size: 16px; margin: 0 0 10px 0;">Your Atelier Privileges:</h3>
      <ul style="padding-left: 20px; margin: 0; line-height: 1.8; font-size: 13px; color: #444;">
        <li><strong>Interactive 3D Neckline & Sleeve Customization:</strong> Design your perfect blouse silhouette online.</li>
        <li><strong>Master Tailor Measurement Profiles:</strong> Save precise body measurements with guided visual instructions.</li>
        <li><strong>Signature 7-Day Perfect Fit Guarantee:</strong> Complimentary fitting adjustments if your blouse does not sit like a second skin.</li>
        <li><strong>Direct Atelier WhatsApp Concierge:</strong> Chat with our master cutting masters anytime for styling advice.</li>
      </ul>
    </div>

    <p style="font-size: 13px; color: #555;">Browse our curated collection of pure Kanjivaram silk, heritage Pochampally ikat, delicate Lucknowi chikankari, and regal bridal zardosi designs.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="http://localhost:3000/designs" class="btn">Explore Catalogue</a>
    </div>
  `;

  const textAlternative = `
Welcome to Keerti Couture Atelier, ${user.name || 'Valued Patron'}!

We are honored to have you with us. Keerti Couture provides bespoke designer blouse tailoring, bridal embroidery, and pure silk creations with our signature 7-Day Perfect Fit Guarantee.

Your Atelier Privileges:
- Interactive neckline, sleeve, and back style customization
- Master tailor measurement profiles
- Direct atelier WhatsApp concierge: +91 80881 79166

Explore our collection: http://localhost:3000/designs

Mangalwar Peth, Behind Shivanubhava Mantap, Banhatti, Karnataka — 587311
Concierge: +91 80881 79166 | +91 99458 04019
`;

  return sendWithRetry({
    to: recipient,
    subject: `Welcome to Keerti Couture Atelier | Bespoke Luxury`,
    html: getLuxuryEmailWrapper('Welcome to Keerti Couture', contentHtml),
    text: textAlternative.trim(),
  });
};

// ── 2. Order Confirmation ────────────────────────────────────────────────────
const sendOrderConfirmationEmail = async (order, userEmail) => {
  const shortId = `KC-${order._id.toString().slice(-6).toUpperCase()}`;
  const recipient = userEmail || order.email || (order.user && order.user.email);
  if (!recipient) return { success: false, error: 'No recipient email' };

  const safeName = escapeHtml(order.customerName || 'Valued Patron');
  const safeMethod = escapeHtml(
    order.paymentMethod === 'PayOnline'
      ? 'Paid in Full Online'
      : order.paymentMethod === 'PayAdvance'
      ? 'Advance Deposit'
      : 'Pay at Pickup'
  );

  const contentHtml = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">Your Couture Order is Confirmed</h2>
    <p>Dear ${safeName},</p>
    <p>Thank you for trusting Keerti Couture. Your bespoke blouse order has been placed into our atelier schedule for master pattern drafting and tailoring.</p>

    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7F7775;">Order Reference</span>
        <strong style="font-family: monospace; font-size: 14px;">${shortId}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7F7775;">Payment Method</span>
        <span>${safeMethod}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7F7775;">Total Amount</span>
        <strong style="color: #8B2238; font-size: 16px;">₹${(order.totalPrice || 0).toLocaleString('en-IN')}</strong>
      </div>
      ${order.remainingAmount && order.remainingAmount > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-top: 8px; border-top: 1px dashed #D6CEC5; padding-top: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7F7775;">Remaining at Dispatch</span>
        <strong style="color: #1C1613;">₹${order.remainingAmount.toLocaleString('en-IN')}</strong>
      </div>` : ''}
    </div>

    <p style="font-size: 12px; color: #555;">Our master cutters will verify your submitted measurements before fabric allocation. Every piece includes our signature <strong>7-Day Perfect Fit Guarantee</strong>.</p>
  `;

  const textAlternative = `
Your Couture Order is Confirmed — ${shortId}

Dear ${order.customerName || 'Valued Patron'},
Thank you for trusting Keerti Couture. Your bespoke blouse order has been placed into our atelier schedule.

Order Reference: ${shortId}
Payment Method: ${order.paymentMethod}
Total Price: ₹${(order.totalPrice || 0).toLocaleString('en-IN')}
${order.remainingAmount ? `Remaining at Dispatch: ₹${order.remainingAmount.toLocaleString('en-IN')}\n` : ''}

Every order includes our signature 7-Day Perfect Fit Guarantee.
Concierge: +91 80881 79166 | +91 99458 04019
`;

  return sendWithRetry({
    to: recipient,
    subject: `Order Confirmed: ${shortId} | Keerti Couture`,
    html: getLuxuryEmailWrapper('Order Confirmed', contentHtml),
    text: textAlternative.trim(),
  });
};

// ── 3. Payment Status Update ─────────────────────────────────────────────────
const sendPaymentStatusEmail = async (order, paymentDetails) => {
  const shortId = `KC-${order._id.toString().slice(-6).toUpperCase()}`;
  const recipient = order.email || (order.user && order.user.email);
  if (!recipient) return { success: false, error: 'No recipient email' };

  const isPaid = order.paymentStatus === 'Paid';
  const isFailed = order.paymentStatus === 'Failed';
  const safeName = escapeHtml(order.customerName || 'Customer');

  const contentHtml = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">
      ${isPaid ? 'Payment Received & Verified' : isFailed ? 'Payment Attempt Failed' : 'Payment Status Updated'}
    </h2>
    <p>Dear ${safeName},</p>
    <p>${isPaid
      ? 'We have successfully captured and verified your payment. Your tailoring order is now proceeding in our atelier.'
      : isFailed
      ? 'Your payment attempt was not completed. You can retry your payment or choose to pay at boutique pickup.'
      : `Your order payment status is currently: <strong>${escapeHtml(order.paymentStatus)}</strong>.`}
    </p>

    <div class="card">
      <p style="margin: 0 0 6px 0;"><strong>Order:</strong> ${shortId}</p>
      <p style="margin: 0 0 6px 0;"><strong>Status:</strong> <span class="badge ${isPaid ? 'badge-paid' : isFailed ? 'badge-rose' : 'badge-pending'}">${escapeHtml(order.paymentStatus)}</span></p>
      ${paymentDetails?.paymentId ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #666;"><strong>Transaction ID:</strong> ${escapeHtml(paymentDetails.paymentId)}</p>` : ''}
      <p style="margin: 0; font-size: 14px;"><strong>Total Order:</strong> ₹${(order.totalPrice || 0).toLocaleString('en-IN')}</p>
    </div>
  `;

  const textAlternative = `
Payment Status: ${order.paymentStatus} — Order ${shortId}

Dear ${order.customerName || 'Customer'},
${isPaid ? 'Payment captured and verified successfully.' : isFailed ? 'Payment attempt was not completed.' : `Status is now: ${order.paymentStatus}`}

Order ID: ${shortId}
Payment Status: ${order.paymentStatus}
Total Price: ₹${(order.totalPrice || 0).toLocaleString('en-IN')}

Keerti Couture Atelier • +91 80881 79166
`;

  return sendWithRetry({
    to: recipient,
    subject: `Payment ${order.paymentStatus}: ${shortId} | Keerti Couture`,
    html: getLuxuryEmailWrapper('Payment Update', contentHtml),
    text: textAlternative.trim(),
  });
};

// ── 4. Appointment Status Notification ───────────────────────────────────────
const sendAppointmentStatusEmail = async (appointment, action = 'booked') => {
  const recipient = appointment.email;
  if (!recipient) return { success: false, error: 'No recipient email' };

  const safeName = escapeHtml(appointment.customerName || 'Patron');
  const safeType = escapeHtml(appointment.consultType || 'In-Studio Fitting');
  const safeSlot = escapeHtml(appointment.timeSlot || 'Atelier Standard');
  const safeNotes = escapeHtml(appointment.adminNotes || '');

  const formattedDate = new Date(appointment.preferredDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let subject = '';
  let headline = '';
  let bodyText = '';

  if (action === 'booked') {
    subject = `Appointment Request Received: ${safeType}`;
    headline = 'Appointment Request Received';
    bodyText = 'Thank you for requesting an atelier fitting consultation. Our team is reviewing the calendar and will confirm shortly.';
  } else if (action === 'confirmed') {
    subject = `Appointment Confirmed: ${safeType}`;
    headline = 'Your Atelier Fitting is Confirmed';
    bodyText = 'Your consultation appointment has been officially confirmed by our master stylist. We look forward to meeting you.';
  } else if (action === 'rescheduled') {
    subject = `Appointment Rescheduled: ${safeType}`;
    headline = 'Your Appointment Has Been Rescheduled';
    bodyText = `Your appointment has been adjusted to ${formattedDate} (${safeSlot}). If this time does not suit you, please let us know.`;
  } else if (action === 'cancelled') {
    subject = `Appointment Cancelled: ${safeType}`;
    headline = 'Appointment Cancellation';
    bodyText = 'Your appointment request has been cancelled. Please visit our website or WhatsApp our concierge if you would like to book a new slot.';
  }

  const contentHtml = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">${headline}</h2>
    <p>Dear ${safeName},</p>
    <p>${bodyText}</p>

    <div class="card">
      <p style="margin: 0 0 6px 0;"><strong>Consultation Mode:</strong> ${safeType}</p>
      <p style="margin: 0 0 6px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 0 0 6px 0;"><strong>Time Slot:</strong> ${safeSlot}</p>
      <p style="margin: 0 0 6px 0;"><strong>Status:</strong> <span class="badge ${appointment.status === 'Confirmed' ? 'badge-paid' : 'badge-rose'}">${escapeHtml(appointment.status)}</span></p>
      ${safeNotes ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #7F7775; border-top: 1px dashed #DDD; padding-top: 6px;"><strong>Atelier Notes:</strong> ${safeNotes}</p>` : ''}
    </div>
  `;

  const textAlternative = `
${headline}

Dear ${appointment.customerName},
${bodyText}

Date: ${formattedDate}
Time Slot: ${appointment.timeSlot || 'Standard'}
Status: ${appointment.status}

Keerti Couture Atelier • Banhatti
Concierge: +91 80881 79166
`;

  return sendWithRetry({
    to: recipient,
    subject: `${subject} | Keerti Couture`,
    html: getLuxuryEmailWrapper(headline, contentHtml),
    text: textAlternative.trim(),
  });
};

// ── 5. Quotation Update Notification ─────────────────────────────────────────
const sendQuotationUpdateEmail = async (quotation, action = 'received') => {
  const recipient = quotation.email;
  if (!recipient) return { success: false, error: 'No recipient email' };

  const safeName = escapeHtml(quotation.customerName || 'Patron');
  const safeFabric = escapeHtml(quotation.preferredFabric || 'Silk / Brocade');
  const safeTurnaround = escapeHtml(quotation.quotedTurnaround || '7-10 Days');
  const safeFeedback = escapeHtml(quotation.adminFeedback || '');

  let subject = '';
  let headline = '';
  let bodyText = '';

  if (action === 'received') {
    subject = 'Custom Design Request Received';
    headline = 'Inspiration Design Received';
    bodyText = 'Our master tailors and embroidery specialists have received your design reference. We are evaluating fabric and needlework requirements to provide you with a detailed quote.';
  } else if (action === 'quoted') {
    subject = `Custom Design Quote Ready: ₹${quotation.quotedAmount?.toLocaleString('en-IN')}`;
    headline = 'Your Custom Blouse Quote is Ready';
    bodyText = `Our head master cutter has reviewed your design reference and prepared an itemized quote for your bespoke garment.`;
  } else if (action === 'accepted') {
    subject = 'Custom Design Quote Accepted';
    headline = 'Quote Accepted — Ready for Stitching';
    bodyText = 'Thank you for accepting the tailoring quotation! We will begin fabric preparation and pattern drafting.';
  }

  const contentHtml = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">${headline}</h2>
    <p>Dear ${safeName},</p>
    <p>${bodyText}</p>

    <div class="card">
      <p style="margin: 0 0 6px 0;"><strong>Fabric Preference:</strong> ${safeFabric}</p>
      <p style="margin: 0 0 6px 0;"><strong>Status:</strong> <span class="badge ${quotation.status === 'Quoted' ? 'badge-paid' : 'badge-rose'}">${escapeHtml(quotation.status)}</span></p>
      ${quotation.quotedAmount ? `
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #EAE3DA;">
        <span style="font-size: 11px; text-transform: uppercase; color: #7F7775;">Quoted Tailoring Price</span>
        <p style="font-size: 20px; font-weight: bold; color: #8B2238; margin: 4px 0;">₹${quotation.quotedAmount.toLocaleString('en-IN')}</p>
        ${safeTurnaround ? `<p style="font-size: 12px; color: #555; margin: 0;">Estimated Turnaround: ${safeTurnaround}</p>` : ''}
        ${safeFeedback ? `<p style="font-size: 12px; color: #555; margin: 4px 0 0 0;">Master Tailor Notes: "${safeFeedback}"</p>` : ''}
      </div>` : ''}
    </div>
  `;

  const textAlternative = `
${headline}

Dear ${quotation.customerName},
${bodyText}

Fabric: ${quotation.preferredFabric || 'Silk / Brocade'}
Status: ${quotation.status}
${quotation.quotedAmount ? `Quoted Price: ₹${quotation.quotedAmount.toLocaleString('en-IN')}\nTurnaround: ${quotation.quotedTurnaround || '7-10 Days'}` : ''}

Keerti Couture Atelier • +91 80881 79166
`;

  return sendWithRetry({
    to: recipient,
    subject: `${subject} | Keerti Couture`,
    html: getLuxuryEmailWrapper(headline, contentHtml),
    text: textAlternative.trim(),
  });
};

// ── 6. Order Status Update (Atelier Progress) ────────────────────────────────
const sendOrderStatusUpdateEmail = async (order, previousStatus = '') => {
  const shortId = `KC-${(order._id || order.orderId).toString().slice(-6).toUpperCase()}`;
  const recipient = order.email;
  if (!recipient) return { success: false, error: 'No recipient email' };

  const safeName = escapeHtml(order.customerName || 'Valued Patron');
  const safeStatus = escapeHtml(order.status || 'Processing');

  const contentHtml = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">Atelier Progress: Order ${safeStatus}</h2>
    <p>Dear ${safeName},</p>
    <p>We are pleased to inform you that your bespoke tailoring order has advanced in our atelier workflow.</p>

    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7F7775;">Order Reference</span>
        <strong style="font-family: monospace; font-size: 14px;">${shortId}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7F7775;">Current Stage</span>
        <span class="badge badge-rose">${safeStatus}</span>
      </div>
      ${order.trackingNumber ? `
      <div style="display: flex; justify-content: space-between; margin-top: 8px; border-top: 1px dashed #D6CEC5; padding-top: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7F7775;">Courier Tracking</span>
        <strong style="color: #1C1613;">${escapeHtml(order.trackingNumber)}</strong>
      </div>` : ''}
    </div>

    <p style="font-size: 12px; color: #555;">Track live tailoring progress anytime through your personal client account.</p>
    <div style="text-align: center; margin: 20px 0;">
      <a href="http://localhost:3000/profile" class="btn">View Order Details</a>
    </div>
  `;

  const textAlternative = `
Atelier Progress: Order ${order.status} (${shortId})

Dear ${order.customerName || 'Valued Patron'},
Your bespoke order ${shortId} is now at stage: ${order.status}.

Track progress online: http://localhost:3000/profile
Concierge: +91 80881 79166
`;

  return sendWithRetry({
    to: recipient,
    subject: `Order Update: ${safeStatus} (${shortId}) | Keerti Couture`,
    html: getLuxuryEmailWrapper(`Order ${safeStatus}`, contentHtml),
    text: textAlternative.trim(),
  });
};

// ── 7. Password Reset Email ──────────────────────────────────────────────────
const sendPasswordResetEmail = async (user, resetToken) => {
  const recipient = user.email;
  if (!recipient) return { success: false, error: 'No recipient email' };

  const safeName = escapeHtml(user.name || 'Valued Patron');
  const resetUrl = `http://localhost:3000/login?resetToken=${encodeURIComponent(resetToken)}`;

  const contentHtml = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">Password Reset Request</h2>
    <p>Dear ${safeName},</p>
    <p>We received a request to reset your password for your Keerti Couture atelier account.</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>

    <div class="card">
      <p style="margin: 0; font-size: 12px; color: #666;">
        This password reset link is valid for <strong>1 hour</strong>. If you did not initiate this request, your account remains secure and you may safely disregard this message.
      </p>
    </div>
  `;

  const textAlternative = `
Password Reset Request — Keerti Couture Atelier

Dear ${user.name || 'Valued Patron'},
We received a request to reset your password. Use the following link within 1 hour:

${resetUrl}

If you did not request this, please disregard this email.
Keerti Couture Atelier Concierge: +91 80881 79166
`;

  return sendWithRetry({
    to: recipient,
    subject: `Password Reset Request | Keerti Couture Atelier`,
    html: getLuxuryEmailWrapper('Password Reset', contentHtml),
    text: textAlternative.trim(),
  });
};

module.exports = {
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
};
