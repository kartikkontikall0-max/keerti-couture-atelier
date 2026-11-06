const nodemailer = require('nodemailer');

// ── Transporter Setup ────────────────────────────────────────────────────────
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
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
      // Brief exponential backoff
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempts)));
    }
  }
};

// ── HTML Email Wrapper ──────────────────────────────────────────────────────
const getLuxuryEmailWrapper = (title, contentHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
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

// ── Specific Transactional Email Senders ─────────────────────────────────────

// 1. Order Confirmation
const sendOrderConfirmationEmail = async (order, userEmail) => {
  const shortId = `KC-${order._id.toString().slice(-6).toUpperCase()}`;
  const recipient = userEmail || order.email || (order.user && order.user.email);
  if (!recipient) return { success: false, error: 'No recipient email' };

  const content = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">Your Couture Order is Confirmed</h2>
    <p>Dear ${order.customerName || 'Valued Patron'},</p>
    <p>Thank you for trusting Keerti Couture. Your bespoke blouse order has been placed into our atelier schedule for master pattern drafting and tailoring.</p>
    
    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7F7775;">Order Reference</span>
        <strong style="font-family: monospace; font-size: 14px;">${shortId}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7F7775;">Payment Method</span>
        <span>${order.paymentMethod === 'PayOnline' ? 'Paid in Full Online' : order.paymentMethod === 'PayAdvance' ? 'Advance Deposit' : 'Pay at Pickup'}</span>
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

  return sendWithRetry({
    to: recipient,
    subject: `Order Confirmed: ${shortId} | Keerti Couture`,
    html: getLuxuryEmailWrapper('Order Confirmed', content),
  });
};

// 2. Payment Status Update
const sendPaymentStatusEmail = async (order, paymentDetails) => {
  const shortId = `KC-${order._id.toString().slice(-6).toUpperCase()}`;
  const recipient = order.email || (order.user && order.user.email);
  if (!recipient) return { success: false, error: 'No recipient email' };

  const isPaid = order.paymentStatus === 'Paid';
  const isFailed = order.paymentStatus === 'Failed';

  const content = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">
      ${isPaid ? 'Payment Received & Verified' : isFailed ? 'Payment Attempt Failed' : 'Payment Status Updated'}
    </h2>
    <p>Dear ${order.customerName || 'Customer'},</p>
    <p>${isPaid
      ? 'We have successfully captured and verified your payment. Your tailoring order is now proceeding in our atelier.'
      : isFailed
      ? 'Your payment attempt was not completed. You can retry your payment or choose to pay at boutique pickup.'
      : `Your order payment status is currently: <strong>${order.paymentStatus}</strong>.`}
    </p>

    <div class="card">
      <p style="margin: 0 0 6px 0;"><strong>Order:</strong> ${shortId}</p>
      <p style="margin: 0 0 6px 0;"><strong>Status:</strong> <span class="badge ${isPaid ? 'badge-paid' : isFailed ? 'badge-rose' : 'badge-pending'}">${order.paymentStatus}</span></p>
      ${paymentDetails?.paymentId ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #666;"><strong>Transaction ID:</strong> ${paymentDetails.paymentId}</p>` : ''}
      <p style="margin: 0; font-size: 14px;"><strong>Total Order:</strong> ₹${(order.totalPrice || 0).toLocaleString('en-IN')}</p>
    </div>
  `;

  return sendWithRetry({
    to: recipient,
    subject: `Payment ${order.paymentStatus}: ${shortId} | Keerti Couture`,
    html: getLuxuryEmailWrapper('Payment Update', content),
  });
};

// 3. Appointment Notification
const sendAppointmentStatusEmail = async (appointment, action = 'booked') => {
  const recipient = appointment.email;
  if (!recipient) return { success: false, error: 'No recipient email' };

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
    subject = `Appointment Request Received: ${appointment.consultType}`;
    headline = 'Appointment Request Received';
    bodyText = 'Thank you for requesting an atelier fitting consultation. Our team is reviewing the calendar and will confirm shortly.';
  } else if (action === 'confirmed') {
    subject = `Appointment Confirmed: ${appointment.consultType}`;
    headline = 'Your Atelier Fitting is Confirmed';
    bodyText = 'Your consultation appointment has been officially confirmed by our master stylist. We look forward to meeting you.';
  } else if (action === 'rescheduled') {
    subject = `Appointment Rescheduled: ${appointment.consultType}`;
    headline = 'Your Appointment Has Been Rescheduled';
    bodyText = `Your appointment has been adjusted to ${formattedDate} (${appointment.timeSlot || ''}). If this time does not suit you, please let us know.`;
  } else if (action === 'cancelled') {
    subject = `Appointment Cancelled: ${appointment.consultType}`;
    headline = 'Appointment Cancellation';
    bodyText = 'Your appointment request has been cancelled. Please visit our website or WhatsApp our concierge if you would like to book a new slot.';
  }

  const content = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">${headline}</h2>
    <p>Dear ${appointment.customerName},</p>
    <p>${bodyText}</p>

    <div class="card">
      <p style="margin: 0 0 6px 0;"><strong>Consultation Mode:</strong> ${appointment.consultType}</p>
      <p style="margin: 0 0 6px 0;"><strong>Date:</strong> ${formattedDate}</p>
      <p style="margin: 0 0 6px 0;"><strong>Time Slot:</strong> ${appointment.timeSlot || 'Atelier Standard'}</p>
      <p style="margin: 0 0 6px 0;"><strong>Status:</strong> <span class="badge ${appointment.status === 'Confirmed' ? 'badge-paid' : 'badge-rose'}">${appointment.status}</span></p>
      ${appointment.adminNotes ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #7F7775; border-top: 1px dashed #DDD; padding-top: 6px;"><strong>Atelier Notes:</strong> ${appointment.adminNotes}</p>` : ''}
    </div>
  `;

  return sendWithRetry({
    to: recipient,
    subject: `${subject} | Keerti Couture`,
    html: getLuxuryEmailWrapper(headline, content),
  });
};

// 4. Quotation Update
const sendQuotationUpdateEmail = async (quotation, action = 'received') => {
  const recipient = quotation.email;
  if (!recipient) return { success: false, error: 'No recipient email' };

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

  const content = `
    <h2 style="font-family: Georgia, serif; color: #1C1613; font-size: 22px; margin-top: 0;">${headline}</h2>
    <p>Dear ${quotation.customerName},</p>
    <p>${bodyText}</p>

    <div class="card">
      <p style="margin: 0 0 6px 0;"><strong>Fabric Preference:</strong> ${quotation.preferredFabric || 'Silk / Brocade'}</p>
      <p style="margin: 0 0 6px 0;"><strong>Status:</strong> <span class="badge ${quotation.status === 'Quoted' ? 'badge-paid' : 'badge-rose'}">${quotation.status}</span></p>
      ${quotation.quotedAmount ? `
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #EAE3DA;">
        <span style="font-size: 11px; text-transform: uppercase; color: #7F7775;">Quoted Tailoring Price</span>
        <p style="font-size: 20px; font-weight: bold; color: #8B2238; margin: 4px 0;">₹${quotation.quotedAmount.toLocaleString('en-IN')}</p>
        ${quotation.quotedTurnaround ? `<p style="font-size: 12px; color: #555; margin: 0;">Estimated Turnaround: ${quotation.quotedTurnaround}</p>` : ''}
        ${quotation.adminFeedback ? `<p style="font-size: 12px; color: #555; margin: 4px 0 0 0;">Master Tailor Notes: "${quotation.adminFeedback}"</p>` : ''}
      </div>` : ''}
    </div>
  `;

  return sendWithRetry({
    to: recipient,
    subject: `${subject} | Keerti Couture`,
    html: getLuxuryEmailWrapper(headline, content),
  });
};

module.exports = {
  getTransporter,
  setTransporter,
  resetTransporter,
  sendOrderConfirmationEmail,
  sendPaymentStatusEmail,
  sendAppointmentStatusEmail,
  sendQuotationUpdateEmail,
};

