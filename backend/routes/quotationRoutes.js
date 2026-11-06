const express = require('express');
const router = express.Router();
const {
  createQuotation,
  getMyQuotations,
  getQuotationById,
  respondToQuote,
  getAllQuotations,
  provideQuote,
} = require('../controllers/quotationController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');
const { quotationLimiter } = require('../middleware/rateLimiter');

// Customer create or Admin get all
router
  .route('/')
  .post(quotationLimiter, optionalProtect, createQuotation)
  .get(protect, admin, getAllQuotations);

// Customer view their quotations (supports both /my and /myquotations)
router.get('/myquotations', protect, getMyQuotations);
router.get('/my', protect, getMyQuotations);

// Customer respond (Accept or Decline)
router.put('/:id/respond', protect, respondToQuote);

// Admin submit quote & feedback
router.put('/:id/quote', protect, admin, provideQuote);

// Get by ID (Owner or Admin)
router.get('/:id', protect, getQuotationById);

module.exports = router;
