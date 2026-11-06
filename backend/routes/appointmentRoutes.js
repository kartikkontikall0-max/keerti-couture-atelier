const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
} = require('../controllers/appointmentController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');
const { appointmentLimiter } = require('../middleware/rateLimiter');

// Public or Authenticated booking; Admin list all
router
  .route('/')
  .post(appointmentLimiter, optionalProtect, createAppointment)
  .get(protect, admin, getAllAppointments);

// Customer view their appointments (supports both /my and /myappointments)
router.get('/myappointments', protect, getMyAppointments);
router.get('/my', protect, getMyAppointments);

// Customer or Admin cancel appointment
router.put('/:id/cancel', protect, cancelAppointment);

// Admin status updates
router.put('/:id/status', protect, admin, updateAppointmentStatus);

// Admin reschedule
router.put('/:id/reschedule', protect, admin, rescheduleAppointment);

// Get by ID (Owner or Admin)
router.get('/:id', protect, getAppointmentById);

module.exports = router;
