const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true,
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  design: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Design',
  },
  customReferenceImage: {
    url: { type: String },
    notes: { type: String },
  },
  customizationOptions: {
    neckStyle: String,
    sleeveType: String,
    backDesign: String,
    paddingOption: String,
    liningOption: String,
    embroideryOption: String,
    fabricColor: String,
  },
  measurements: {
    bust: Number,
    waist: Number,
    shoulder: Number,
    armhole: Number,
    sleeveLength: Number,
    blouseLength: Number,
    frontNeckDepth: Number,
    backNeckDepth: Number,
    guideImageNotes: String,
  },
  extraServices: [
    {
      serviceId: { type: String },
      name: String,
      price: Number,
    }
  ],
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative'],
  },
  status: {
    type: String,
    required: true,
    enum: ['Order received', 'Stitching started', 'Stitching completed', 'Ready for pickup', 'Delivered'],
    default: 'Order received',
  },

  // ── Payment fields ─────────────────────────────────────────────────────────
  paymentMethod: {
    type: String,
    enum: ['PayOnline', 'PayAdvance', 'PayAtPickup'],
    default: 'PayAtPickup',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Paid', 'Failed'],
    default: 'Pending',
  },
  razorpayOrderId: { type: String, trim: true },
  razorpayPaymentId: { type: String, trim: true },
  advancePaid: { type: Boolean, default: false },
  advanceAmount: { type: Number, default: 0, min: 0 },
  remainingAmount: { type: Number, default: 0, min: 0 },
  paidAt: { type: Date },
  paymentEmailSent: { type: Boolean, default: false },

  // Legacy field — kept for backward compat
  isPaid: { type: Boolean, default: false },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String,
  }
}, {
  timestamps: true,
});

// Database indexes for fast querying and reporting
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ razorpayOrderId: 1 });
orderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
