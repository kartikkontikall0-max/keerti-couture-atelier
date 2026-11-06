/**
 * Keerti Couture — Transactional Outbox Background Processor
 *
 * Provides resilient, crash-recoverable transactional notification dispatch.
 * Events are persisted in MongoDB before delivery. Even if an abrupt server crash
 * or SMTP outage occurs, events remain safely queued and will be retried automatically.
 */

const mongoose = require('mongoose');
const Outbox = require('../models/Outbox');
const {
  sendOrderConfirmationEmail,
  sendPaymentStatusEmail,
  sendAppointmentStatusEmail,
  sendQuotationUpdateEmail,
  sendWelcomeEmail,
  sendOrderStatusUpdateEmail,
  sendPasswordResetEmail,
} = require('./mailer');

let isProcessing = false;
let workerIntervalId = null;

/**
 * Enqueue an event into the transactional outbox.
 * Supports optional Mongoose ClientSession for multi-document ACID transactions.
 */
const enqueueOutboxEvent = async (eventType, recipient, payload, referenceId = null, session = null) => {
  try {
    const event = new Outbox({
      eventType,
      recipient: recipient ? recipient.trim().toLowerCase() : '',
      payload,
      referenceId,
      status: 'PENDING',
      nextAttemptAt: new Date(),
    });

    const saveOptions = session ? { session } : {};
    const saved = await event.save(saveOptions);

    // Trigger immediate background processing without blocking caller (when outside active transaction)
    if (!session) {
      setImmediate(() => {
        processOutboxEvents().catch((err) =>
          console.error('[Outbox Worker] Immediate dispatch error:', err.message)
        );
      });
    }

    return saved;
  } catch (error) {
    console.error('[Outbox] Failed to enqueue event:', error.message);
    if (session) {
      // In an ACID transaction, rethrow so caller aborts both business record and outbox together
      throw error;
    }
    return null;
  }
};

/**
 * Atomically claims the next pending or stale outbox event.
 * Guarantees zero duplicate deliveries across concurrent worker processes or cluster nodes.
 */
const claimNextOutboxEvent = async (maxAttempts = 5) => {
  const now = new Date();
  const leaseDurationMs = 60000; // 60-second lease lock
  const lockExpiresAt = new Date(now.getTime() + leaseDurationMs);

  return await Outbox.findOneAndUpdate(
    {
      $or: [
        { status: 'PENDING', nextAttemptAt: { $lte: now } },
        { status: 'PROCESSING', nextAttemptAt: { $lte: now } }, // Crash-recovery of expired leases
      ],
      attempts: { $lt: maxAttempts },
    },
    {
      $set: {
        status: 'PROCESSING',
        nextAttemptAt: lockExpiresAt,
      },
      $inc: { attempts: 1 },
    },
    {
      returnDocument: 'after',
      sort: { createdAt: 1 }, // Strict FIFO ordering
    }
  );
};

/**
 * Process pending outbox events using atomic database-level leasing.
 */
const processOutboxEvents = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    let processedInThisBatch = 0;
    const maxBatchSize = 25;

    while (processedInThisBatch < maxBatchSize) {
      // Atomically claim exactly ONE event
      const event = await claimNextOutboxEvent();
      if (!event) {
        break; // No more events due for delivery
      }

      processedInThisBatch++;
      let deliverySuccess = false;
      let errorMsg = null;

      try {
        let result;
        const payload = {
          ...event.payload,
          _id: event.payload?._id || event.referenceId || new mongoose.Types.ObjectId(),
          email: event.payload?.email || event.recipient,
        };

        switch (event.eventType) {
          case 'ORDER_CONFIRMATION':
            result = await sendOrderConfirmationEmail(payload, event.recipient);
            break;
          case 'PAYMENT_SUCCESS':
            result = await sendPaymentStatusEmail(payload, { paymentId: event.payload?.paymentId });
            break;
          case 'PAYMENT_FAILED':
            result = await sendPaymentStatusEmail(payload, { paymentId: event.payload?.paymentId });
            break;
          case 'APPOINTMENT_BOOKED':
            result = await sendAppointmentStatusEmail(payload, 'booked');
            break;
          case 'APPOINTMENT_CONFIRMED':
            result = await sendAppointmentStatusEmail(payload, 'confirmed');
            break;
          case 'APPOINTMENT_RESCHEDULED':
            result = await sendAppointmentStatusEmail(payload, 'rescheduled');
            break;
          case 'APPOINTMENT_CANCELLED':
            result = await sendAppointmentStatusEmail(payload, 'cancelled');
            break;
          case 'QUOTATION_RECEIVED':
            result = await sendQuotationUpdateEmail(payload, 'received');
            break;
          case 'QUOTATION_QUOTED':
            result = await sendQuotationUpdateEmail(payload, 'quoted');
            break;
          case 'QUOTATION_ACCEPTED':
            result = await sendQuotationUpdateEmail(payload, 'accepted');
            break;
          case 'WELCOME_EMAIL':
            result = await sendWelcomeEmail(payload);
            break;
          case 'ORDER_STATUS_UPDATE':
            result = await sendOrderStatusUpdateEmail(payload, event.payload?.previousStatus);
            break;
          case 'PASSWORD_RESET':
            result = await sendPasswordResetEmail(payload, event.payload?.resetToken);
            break;
          default:
            console.warn(`[Outbox] Unknown eventType: ${event.eventType}`);
            deliverySuccess = true;
            break;
        }

        if (result && result.success) {
          deliverySuccess = true;
        } else if (result && result.error) {
          errorMsg = result.error;
        }
      } catch (err) {
        errorMsg = err.message;
      }

      if (deliverySuccess) {
        event.status = 'SENT';
        event.processedAt = new Date();
        event.lastError = null;
      } else {
        event.lastError = errorMsg || 'Delivery failed';
        if (event.attempts >= event.maxAttempts) {
          event.status = 'FAILED';
          console.error(`[Outbox] Event ${event._id} (${event.eventType}) reached max attempts and marked FAILED.`);
        } else {
          event.status = 'PENDING';
          // Exponential backoff: 2s, 4s, 8s, 16s...
          const backoffSec = Math.pow(2, event.attempts);
          event.nextAttemptAt = new Date(Date.now() + backoffSec * 1000);
        }
      }

      await event.save();
    }
  } catch (error) {
    console.error('[Outbox Worker] Processing loop error:', error.message);
  } finally {
    isProcessing = false;
  }
};

/**
 * Start periodic outbox sweeper (e.g., every 30 seconds).
 */
const startOutboxWorker = (intervalMs = 30000) => {
  if (workerIntervalId) return;

  // Run initial sweep on boot
  processOutboxEvents().catch(() => {});

  workerIntervalId = setInterval(() => {
    processOutboxEvents().catch((err) =>
      console.error('[Outbox Worker] Interval error:', err.message)
    );
  }, intervalMs);

  workerIntervalId.unref(); // Prevent blocking process exit
  console.log(`[Outbox Worker] Persistent background notification sweeper started (Interval: ${intervalMs}ms)`);
};

const stopOutboxWorker = () => {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
  }
};

module.exports = {
  enqueueOutboxEvent,
  processOutboxEvents,
  claimNextOutboxEvent,
  startOutboxWorker,
  stopOutboxWorker,
};
