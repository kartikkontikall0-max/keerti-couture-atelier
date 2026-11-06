const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred appointment date is required'],
    },
    dateKey: {
      type: String,
      required: [true, 'Calendar date key is required'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date key must be YYYY-MM-DD format'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      trim: true,
    },
    /**
     * Database-Enforced Atomic Concurrency Key:
     * When an appointment is in active status ('Pending', 'Confirmed', 'Rescheduled'),
     * activeSlotKey is set to `${dateKey}__${timeSlot.toLowerCase().trim()}`.
     * When an appointment is cancelled or completed, activeSlotKey is cleared to null.
     * The unique partial index on { activeSlotKey: 1 } prevents race conditions
     * at the database engine level, guaranteeing zero double-bookings.
     */
    activeSlotKey: {
      type: String,
      default: null,
    },
    consultType: {
      type: String,
      required: true,
      enum: [
        'In-Store Atelier Fitting',
        'WhatsApp Video Call',
        'Bridal Trousseau Planning',
      ],
      default: 'In-Store Atelier Fitting',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Database-enforced atomic concurrency constraint:
// Guarantees zero duplicate active bookings for the same date & slot at the database engine level
appointmentSchema.index(
  { activeSlotKey: 1 },
  {
    unique: true,
    partialFilterExpression: { activeSlotKey: { $type: 'string' } },
  }
);

// Query optimization indexes
appointmentSchema.index({ dateKey: 1, timeSlot: 1, status: 1 });
appointmentSchema.index({ preferredDate: 1, timeSlot: 1, status: 1 });
appointmentSchema.index({ user: 1, createdAt: -1 });
appointmentSchema.index({ email: 1, createdAt: -1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;

