/**
 * Keerti Couture — Persistent Transactional Outbox Model
 *
 * Guarantees at-least-once transactional message delivery across system crashes.
 * Notifications (order confirmations, payment captures, appointment reminders)
 * are committed to MongoDB alongside business records.
 *
 * An asynchronous worker processes pending outbox events with exponential backoff retries.
 */

const mongoose = require('mongoose');

const outboxSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        'ORDER_CONFIRMATION',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'APPOINTMENT_BOOKED',
        'APPOINTMENT_CONFIRMED',
        'APPOINTMENT_RESCHEDULED',
        'APPOINTMENT_CANCELLED',
        'QUOTATION_RECEIVED',
        'QUOTATION_QUOTED',
        'QUOTATION_ACCEPTED',
      ],
      index: true,
    },
    recipient: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: '',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastError: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high-throughput worker polling: finds pending events ready for delivery
outboxSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });

const Outbox = mongoose.model('Outbox', outboxSchema);
module.exports = Outbox;
