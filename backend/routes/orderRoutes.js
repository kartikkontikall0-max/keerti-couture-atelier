const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderStatus,
  getMyOrders,
  getOrders,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const { orderLimiter } = require('../middleware/rateLimiter');

router.route('/')
  .post(protect, orderLimiter, addOrderItems)
  .get(protect, admin, getOrders);

router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);

// Protected: Only administrators can manually mark an order as paid without gateway verification
router.route('/:id/pay').put(protect, admin, updateOrderToPaid);

// Protected: Only administrators can advance tailoring stage and modify payment statuses
router.route('/:id/status').put(protect, admin, updateOrderStatus);

module.exports = router;
