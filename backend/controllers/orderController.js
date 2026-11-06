const mongoose = require('mongoose');
const Order = require('../models/Order');
const Design = require('../models/Design');
const { sendOrderConfirmationEmail } = require('../utils/mailer');
const { enqueueOutboxEvent } = require('../utils/outboxProcessor');

// @desc    Create new order or update existing pending draft
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User context missing or unauthenticated' });
    }

    const {
      orderId, // Optional: if retrying payment for an existing pending order
      customerName,
      phone,
      design,
      customizationOptions,
      measurements,
      extraServices = [],
      totalPrice,
      customReferenceImage,
      paymentMethod = 'PayAtPickup',
      advanceAmount = 0,
    } = req.body;

    if (!design) {
      return res.status(400).json({ success: false, message: 'No design selected' });
    }
    if (!mongoose.isValidObjectId(design)) {
      return res.status(400).json({ success: false, message: 'Invalid design ID format' });
    }
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (totalPrice === undefined || totalPrice === null || Number(totalPrice) < 0) {
      return res.status(400).json({ success: false, message: 'A valid non-negative total price is required' });
    }

    const numericTotalPrice = Number(totalPrice);
    const numericAdvanceAmount = Number(advanceAmount) || 0;

    if (paymentMethod === 'PayAdvance') {
      if (numericAdvanceAmount <= 0 || numericAdvanceAmount > numericTotalPrice) {
        return res.status(400).json({
          success: false,
          message: 'Advance amount must be greater than zero and cannot exceed total price',
        });
      }
    }

    const existingDesign = await Design.findById(design);
    if (!existingDesign) {
      return res.status(404).json({ success: false, message: 'Selected design not found in database' });
    }

    // Helper to calculate balance
    let remainingAmount = numericTotalPrice;
    if (paymentMethod === 'PayAdvance') {
      remainingAmount = Math.max(0, numericTotalPrice - numericAdvanceAmount);
    } else if (paymentMethod === 'PayAtPickup') {
      remainingAmount = numericTotalPrice;
    }

    // Check if client provided an existing pending order to update (preventing duplicate zombie orders)
    if (orderId && mongoose.isValidObjectId(orderId)) {
      const existingOrder = await Order.findById(orderId);
      if (
        existingOrder &&
        existingOrder.user.toString() === req.user._id.toString() &&
        existingOrder.paymentStatus === 'Pending'
      ) {
        existingOrder.customerName = customerName.trim();
        existingOrder.phone = phone.trim();
        existingOrder.design = design;
        existingOrder.customizationOptions = customizationOptions;
        existingOrder.measurements = measurements;
        existingOrder.extraServices = extraServices;
        existingOrder.totalPrice = numericTotalPrice;
        existingOrder.customReferenceImage = customReferenceImage;
        existingOrder.paymentMethod = paymentMethod;
        existingOrder.advanceAmount = paymentMethod === 'PayAdvance' ? numericAdvanceAmount : 0;
        existingOrder.remainingAmount = remainingAmount;

        const updatedOrder = await existingOrder.save();
        const whatsappUrl = generateWhatsAppUrl(updatedOrder, existingDesign.name);

        return res.status(200).json({ success: true, order: updatedOrder, whatsappUrl });
      }
    }

    // Create fresh order
    const order = new Order({
      user: req.user._id,
      customerName: customerName.trim(),
      phone: phone.trim(),
      design,
      customizationOptions,
      measurements,
      extraServices,
      totalPrice: numericTotalPrice,
      customReferenceImage,
      paymentMethod,
      paymentStatus: 'Pending',
      advanceAmount: paymentMethod === 'PayAdvance' ? numericAdvanceAmount : 0,
      remainingAmount,
      status: 'Order received',
    });

    const createdOrder = await order.save();
    const whatsappUrl = generateWhatsAppUrl(createdOrder, existingDesign.name);

    enqueueOutboxEvent('ORDER_CONFIRMATION', req.user?.email, createdOrder.toObject(), createdOrder._id);

    sendOrderConfirmationEmail(createdOrder, req.user?.email).catch((e) =>
      console.error('[Order] Confirmation email delivery error:', e.message)
    );

    return res.status(201).json({ success: true, order: createdOrder, whatsappUrl });
  } catch (error) {
    console.error('[Order] Error creating/updating order:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error creating order', error: error.message });
  }
};

// Helper: compose WhatsApp message
function generateWhatsAppUrl(order, designName = 'Blouse') {
  const shortId = `KC-${order._id.toString().slice(-4).toUpperCase()}`;
  let paymentLine = '';
  if (order.paymentMethod === 'PayAtPickup') {
    paymentLine = 'Payment: At Pickup';
  } else if (order.paymentMethod === 'PayAdvance') {
    paymentLine = `Advance: ₹${order.advanceAmount} | Remaining: ₹${order.remainingAmount}`;
  } else {
    paymentLine = `Full Payment: ₹${order.totalPrice}`;
  }

  const waMessage = encodeURIComponent(
    `Hello! Your *Keerti Couture* order is confirmed 🎉\n\nOrder ID: ${shortId}\nDesign: ${designName}\n${paymentLine}\n\nWe will notify you when stitching is ready. Thank you! 🙏`
  );
  const waPhone = (process.env.BUSINESS_WHATSAPP || '919945804019').replace(/\D/g, '');
  return `https://wa.me/${waPhone}?text=${waMessage}`;
}

// @desc    Get order by ID (with strict ownership & admin authorization)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('design', 'name images price category');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Enforce authorization: only the order owner or an administrator can view
    const orderOwnerId = order.user?._id ? order.user._id.toString() : order.user?.toString();
    const isOwner = req.user && orderOwnerId === req.user._id.toString();
    const isAdmin = req.user && req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this order' });
    }

    return res.json(order);
  } catch (error) {
    console.error('[Order] Error fetching order:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching order', error: error.message });
  }
};

// @desc    Update order to paid (Restricted to Administrator for manual verification)
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
const updateOrderToPaid = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentStatus = 'Paid';
    order.remainingAmount = 0;
    order.paymentResult = {
      id: req.body.id || `manual_admin_${Date.now()}`,
      status: req.body.status || 'COMPLETED',
      update_time: new Date().toISOString(),
      email_address: req.user.email,
    };

    const updatedOrder = await order.save();
    console.log(`[Order] Order ${order._id} marked as Paid by Administrator ${req.user.email}`);
    return res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('[Order] Error updating order to paid:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating payment status', error: error.message });
  }
};

// @desc    Update order status and/or payment status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    if (req.body.status) {
      order.status = req.body.status;
    }

    if (req.body.paymentStatus) {
      order.paymentStatus = req.body.paymentStatus;
      if (req.body.paymentStatus === 'Paid') {
        order.remainingAmount = 0;
        order.isPaid = true;
        if (!order.paidAt) order.paidAt = new Date();
      } else if (req.body.paymentStatus === 'Partially Paid') {
        order.remainingAmount = Math.max(0, order.totalPrice - (order.advanceAmount || 300));
        order.advancePaid = true;
      } else if (req.body.paymentStatus === 'Pending') {
        order.remainingAmount = order.totalPrice;
        order.isPaid = false;
      }
    }

    const updatedOrder = await order.save();

    // Trigger transactional outbox status notification if order status changed
    if (req.body.status && req.body.status !== previousStatus) {
      enqueueOutboxEvent(
        'ORDER_STATUS_UPDATE',
        order.email || (order.user && order.user.email),
        {
          orderId: order._id,
          customerName: order.customerName,
          status: req.body.status,
          totalPrice: order.totalPrice,
          previousStatus,
        },
        order._id
      ).catch((err) => {
        console.warn(`[Order] Outbox dispatch warning for status update on ${order._id}:`, err.message);
      });
    }
    return res.json(updatedOrder);
  } catch (error) {
    console.error('[Order] Error updating order status:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating status', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const orders = await Order.find({ user: req.user._id })
      .populate('design', 'name images category price')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    console.error('[Order] Error fetching user orders:', error.message);
    return res.status(500).json({ message: 'Server error fetching user orders', error: error.message });
  }
};

// @desc    Get all orders across business
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id name email phone')
      .populate('design', 'name images category price')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    console.error('[Order] Error fetching all orders:', error.message);
    return res.status(500).json({ message: 'Server error fetching orders', error: error.message });
  }
};

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
};
