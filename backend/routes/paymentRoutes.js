const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { sendPaymentStatusEmail } = require('../utils/mailer');
const { enqueueOutboxEvent } = require('../utils/outboxProcessor');

// ── Razorpay instance (lazy initialization) ──────────────────────────────────
let razorpay;
const getRazorpay = () => {
  if (!razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId === 'your_razorpay_key_id') {
      throw new Error('Razorpay credentials are not configured in environment');
    }
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpay;
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order for a given amount
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/create-order', protect, paymentLimiter, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, orderId } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid positive amount is required' });
    }

    const numericAmount = Number(amount);
    const rz = getRazorpay();

    // Razorpay amounts are measured in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(numericAmount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        orderId: orderId || '',
      },
    };

    const rzOrder = await rz.orders.create(options);

    return res.json({
      success: true,
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('[Payment] Create order error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create payment order' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment signature & update order idempotently
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
router.post('/verify', protect, paymentLimiter, async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,         // MongoDB Order ID
      paymentType,     // 'full' | 'advance'
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing required payment verification fields' });
    }

    // 1. Fetch order and enforce authorization
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const orderOwnerId = order.user?._id ? order.user._id.toString() : order.user?.toString();
    const isOwner = req.user && orderOwnerId === req.user._id.toString();
    const isAdmin = req.user && req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to verify payment for this order' });
    }

    // 2. Idempotency Check: if already verified with this payment ID, return success immediately
    if (
      order.razorpayPaymentId === razorpayPaymentId &&
      (order.paymentStatus === 'Paid' || (paymentType === 'advance' && order.paymentStatus === 'Partially Paid'))
    ) {
      return res.status(200).json({
        success: true,
        message: 'Payment has already been verified and processed',
        order,
      });
    }

    // 3. Duplicate Payment ID check: ensure this payment ID wasn't applied to a different order
    const existingPaymentOrder = await Order.findOne({
      razorpayPaymentId,
      _id: { $ne: order._id },
    });
    if (existingPaymentOrder) {
      return res.status(400).json({
        success: false,
        message: 'This payment ID has already been applied to another order',
      });
    }

    // 4. Verify HMAC signature using timing-safe comparison
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, message: 'Payment gateway secret not configured' });
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(razorpaySignature, 'utf8');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      console.warn(`[Payment] Invalid signature for order ${orderId}`);
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    // 5. Update order state accurately
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.paidAt = new Date();

    if (paymentType === 'advance') {
      order.paymentStatus = 'Partially Paid';
      order.advancePaid = true;
      order.isPaid = false;
      const adv = order.advanceAmount && order.advanceAmount > 0 ? order.advanceAmount : 300;
      order.remainingAmount = Math.max(0, order.totalPrice - adv);
    } else {
      order.paymentStatus = 'Paid';
      order.isPaid = true;
      order.remainingAmount = 0;
    }

    // Only dispatch payment confirmation email once across verify & webhook calls
    const shouldSendEmail = !order.paymentEmailSent;
    if (shouldSendEmail) {
      order.paymentEmailSent = true;
    }

    const updatedOrder = await order.save();
    console.log(`[Payment] Verified payment ${razorpayPaymentId} for order ${order._id} (Status: ${order.paymentStatus})`);

    if (shouldSendEmail) {
      // 1. Dispatch through transactional outbox for crash recovery
      let recipient = (order.user && order.user.email) ? order.user.email : (req.user ? req.user.email : '');
      if (!recipient && order.user) {
        try {
          const u = await User.findById(order.user);
          if (u && u.email) recipient = u.email;
        } catch (_) {}
      }
      enqueueOutboxEvent('PAYMENT_SUCCESS', recipient, {
        ...updatedOrder.toObject(),
        paymentId: razorpayPaymentId,
      }, updatedOrder._id);

      // 2. Immediate direct delivery attempt
      sendPaymentStatusEmail(updatedOrder, { paymentId: razorpayPaymentId }).catch((e) =>
        console.error('[Payment] Verify email error:', e.message)
      );
    }

    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('[Payment] Verify error:', error.message);
    return res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/payments/webhook
// @desc    Razorpay asynchronous server-to-server webhook listener
// @access  Public (Signature validated via RAZORPAY_WEBHOOK_SECRET)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ message: 'Webhook secret not configured' });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ message: 'Missing x-razorpay-signature header' });
    }

    // Use rawBody buffer captured by express.json({ verify })
    const payloadBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      console.warn('[Webhook] Signature verification failed');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Webhook] Received Razorpay event: ${event}`);

    // Event 1: Payment captured / Order paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload?.payment?.entity;
      const rzOrderId = payment?.order_id;
      const paymentId = payment?.id;

      if (rzOrderId) {
        const order = await Order.findOne({ razorpayOrderId: rzOrderId });
        if (order) {
          // Idempotency: skip if already marked as paid with this payment ID
          if (
            order.razorpayPaymentId === paymentId &&
            (order.paymentStatus === 'Paid' || order.paymentStatus === 'Partially Paid')
          ) {
            return res.status(200).json({ status: 'ok', message: 'Already processed' });
          }

          order.razorpayPaymentId = paymentId;
          order.paidAt = new Date();

          if (order.paymentMethod === 'PayAdvance') {
            order.paymentStatus = 'Partially Paid';
            order.advancePaid = true;
            const adv = order.advanceAmount > 0 ? order.advanceAmount : 300;
            order.remainingAmount = Math.max(0, order.totalPrice - adv);
          } else {
            order.paymentStatus = 'Paid';
            order.isPaid = true;
            order.remainingAmount = 0;
          }

          const shouldSendEmail = !order.paymentEmailSent;
          if (shouldSendEmail) {
            order.paymentEmailSent = true;
          }

          await order.save();
          console.log(`[Webhook] Reconciled payment for order ${order._id}`);

          if (shouldSendEmail) {
            let recipient = (order.user && order.user.email) ? order.user.email : '';
            if (!recipient && order.user) {
              try {
                const u = await User.findById(order.user);
                if (u && u.email) recipient = u.email;
              } catch (_) {}
            }
            enqueueOutboxEvent('PAYMENT_SUCCESS', recipient, {
              ...order.toObject(),
              paymentId,
            }, order._id);

            sendPaymentStatusEmail(order, { paymentId }).catch((e) =>
              console.error('[Webhook] Email error:', e.message)
            );
          }
        }
      }
    }

    // Event 2: Payment failed
    if (event === 'payment.failed') {
      const payment = payload?.payment?.entity;
      const rzOrderId = payment?.order_id;

      if (rzOrderId) {
        const order = await Order.findOne({ razorpayOrderId: rzOrderId });
        if (order && order.paymentStatus !== 'Paid') {
          order.paymentStatus = 'Failed';
          await order.save();
          console.log(`[Webhook] Marked order ${order._id} payment as Failed`);

          sendPaymentStatusEmail(order, { paymentId: payment?.id }).catch((e) =>
            console.error('[Webhook] Email error:', e.message)
          );
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Webhook] Processing error:', error.message);
    return res.status(500).json({ message: 'Internal webhook error' });
  }
});

module.exports = router;
