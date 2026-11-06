const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
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
    preferredFabric: {
      type: String,
      trim: true,
      default: 'Pure Silk / Brocade',
    },
    estimatedBudget: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      required: [true, 'Design notes or requirements are required'],
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    referenceImages: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ['Submitted', 'Under Review', 'Quoted', 'Accepted', 'Declined', 'Closed'],
      default: 'Submitted',
    },
    quotedAmount: {
      type: Number,
      min: [0, 'Quoted amount must be a positive number'],
    },
    quotedTurnaround: {
      type: String,
      trim: true,
    },
    adminFeedback: {
      type: String,
      trim: true,
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    customerResponse: {
      type: String,
      trim: true,
    },
    customerResponseAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

quotationSchema.index({ user: 1, createdAt: -1 });
quotationSchema.index({ email: 1, createdAt: -1 });
quotationSchema.index({ status: 1 });

const Quotation = mongoose.model('Quotation', quotationSchema);
module.exports = Quotation;

