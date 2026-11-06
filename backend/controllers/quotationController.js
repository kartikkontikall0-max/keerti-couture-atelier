const mongoose = require('mongoose');
const Quotation = require('../models/Quotation');
const { sendQuotationUpdateEmail } = require('../utils/mailer');
const { enqueueOutboxEvent } = require('../utils/outboxProcessor');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Submit a new custom design quote request
// @route   POST /api/quotations
// @access  Public (or Authenticated)
const createQuotation = async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      preferredFabric,
      estimatedBudget,
      notes,
      referenceImages,
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!notes || !notes.trim()) {
      return res.status(400).json({ success: false, message: 'Design notes or requirements are required' });
    }

    // Format reference images
    let images = [];
    if (Array.isArray(referenceImages)) {
      images = referenceImages
        .filter((img) => img && (typeof img === 'string' ? img.trim() : img.url))
        .map((img) => (typeof img === 'string' ? { url: img.trim() } : img));
    }

    const quotation = new Quotation({
      user: req.user ? req.user._id : undefined,
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      preferredFabric: preferredFabric || 'Pure Silk / Brocade',
      estimatedBudget: estimatedBudget || '',
      notes: notes.trim(),
      referenceImages: images,
      status: 'Submitted',
    });

    const savedQuotation = await quotation.save();

    enqueueOutboxEvent('QUOTATION_RECEIVED', savedQuotation.email, savedQuotation.toObject(), savedQuotation._id);

    sendQuotationUpdateEmail(savedQuotation, 'received').catch((e) =>
      console.error('[Quotation] Email error:', e.message)
    );

    return res.status(201).json({
      success: true,
      message: 'Custom design request submitted to atelier tailors',
      quotation: savedQuotation,
    });
  } catch (error) {
    console.error('[Quotation] Create error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error submitting quote request', error: error.message });
  }
};

// @desc    Get customer's quotation requests
// @route   GET /api/quotations/myquotations
// @access  Private (Customer)
const getMyQuotations = async (req, res) => {
  try {
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const quotations = await Quotation.find({
      $or: [{ user: req.user._id }, { email: userEmail }],
    }).sort({ createdAt: -1 });

    return res.json({ success: true, quotations });
  } catch (error) {
    console.error('[Quotation] Fetch my quotations error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving quotations' });
  }
};

// @desc    Get quotation by ID
// @route   GET /api/quotations/:id
// @access  Private (Owner or Admin)
const getQuotationById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quotation ID format' });
    }

    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation request not found' });
    }

    const isOwner =
      req.user &&
      ((quotation.user && quotation.user.toString() === req.user._id.toString()) ||
        quotation.email.toLowerCase() === req.user.email.toLowerCase());
    const isAdmin = req.user && req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this quotation' });
    }

    return res.json({ success: true, quotation });
  } catch (error) {
    console.error('[Quotation] Get by ID error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving quotation' });
  }
};

// @desc    Customer accepts or declines quotation
// @route   PUT /api/quotations/:id/respond
// @access  Private (Owner)
const respondToQuote = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quotation ID format' });
    }

    const { response, action, customerNotes, customerResponseNotes } = req.body;
    let normalizedResponse = response;
    if (!normalizedResponse && action) {
      if (typeof action === 'string' && action.toLowerCase() === 'accept') normalizedResponse = 'Accepted';
      if (typeof action === 'string' && action.toLowerCase() === 'decline') normalizedResponse = 'Declined';
    }

    if (!['Accepted', 'Declined'].includes(normalizedResponse)) {
      return res.status(400).json({ success: false, message: 'Response must be either "Accepted" or "Declined"' });
    }

    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation request not found' });
    }

    const isOwner =
      req.user &&
      ((quotation.user && quotation.user.toString() === req.user._id.toString()) ||
        quotation.email.toLowerCase() === req.user.email.toLowerCase());

    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this quotation' });
    }

    if (quotation.status !== 'Quoted') {
      return res.status(400).json({
        success: false,
        message: `Cannot respond to a quotation with status "${quotation.status}". It must be "Quoted".`,
      });
    }

    quotation.status = normalizedResponse;
    const finalNotes = customerNotes || customerResponseNotes;
    quotation.customerResponse = finalNotes ? finalNotes.trim() : normalizedResponse;
    quotation.customerResponseAt = new Date();

    const updated = await quotation.save();

    if (normalizedResponse === 'Accepted') {
      enqueueOutboxEvent('QUOTATION_ACCEPTED', updated.email, updated.toObject(), updated._id);

      sendQuotationUpdateEmail(updated, 'accepted').catch((e) =>
        console.error('[Quotation] Response email error:', e.message)
      );
    }

    return res.json({ success: true, message: `Quotation ${normalizedResponse.toLowerCase()} successfully`, quotation: updated });
  } catch (error) {
    console.error('[Quotation] Respond error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error responding to quotation' });
  }
};

// @desc    Admin lists all custom quotation requests
// @route   GET /api/quotations
// @access  Private/Admin
const getAllQuotations = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const quotations = await Quotation.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: quotations.length, quotations });
  } catch (error) {
    console.error('[Quotation] Get all error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching quotations' });
  }
};

// @desc    Admin provides pricing and feedback quote
// @route   PUT /api/quotations/:id/quote
// @access  Private/Admin
const provideQuote = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quotation ID format' });
    }

    const { quotedAmount, quotedTurnaround, adminFeedback, status } = req.body;

    if (quotedAmount === undefined || quotedAmount === null || Number(quotedAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid positive quoted amount is required' });
    }

    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation request not found' });
    }

    quotation.quotedAmount = Number(quotedAmount);
    if (quotedTurnaround) quotation.quotedTurnaround = quotedTurnaround.trim();
    if (adminFeedback) quotation.adminFeedback = adminFeedback.trim();
    quotation.status = status || 'Quoted';

    const updated = await quotation.save();

    enqueueOutboxEvent('QUOTATION_QUOTED', updated.email, updated.toObject(), updated._id);

    sendQuotationUpdateEmail(updated, 'quoted').catch((e) =>
      console.error('[Quotation] Quote email error:', e.message)
    );

    return res.json({ success: true, message: 'Quotation submitted to customer', quotation: updated });
  } catch (error) {
    console.error('[Quotation] Provide quote error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error providing quotation' });
  }
};

module.exports = {
  createQuotation,
  getMyQuotations,
  getQuotationById,
  respondToQuote,
  getAllQuotations,
  provideQuote,
};
