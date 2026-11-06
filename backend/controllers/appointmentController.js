const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const { sendAppointmentStatusEmail } = require('../utils/mailer');
const { enqueueOutboxEvent } = require('../utils/outboxProcessor');
const {
  getAtelierDateKey,
  getAtelierDayRange,
  isPastDateInAtelier,
} = require('../utils/timezone');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Book a new atelier fitting appointment
// @route   POST /api/appointments
// @access  Public (or Authenticated)
const createAppointment = async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      preferredDate,
      timeSlot,
      consultType,
      notes,
    } = req.body;

    // 1. Validate required fields
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    if (!preferredDate) {
      return res.status(400).json({ success: false, message: 'Preferred appointment date is required' });
    }
    if (!timeSlot || !timeSlot.trim()) {
      return res.status(400).json({ success: false, message: 'Time slot selection is required' });
    }

    // 2. Timezone & date normalization (Asia/Kolkata)
    let dateKey, startOfDay;
    try {
      const dayRange = getAtelierDayRange(preferredDate);
      dateKey = dayRange.dateKey;
      startOfDay = dayRange.startOfDay;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid appointment date format' });
    }

    // Ensure appointment is not in the past relative to current calendar day in Asia/Kolkata
    if (isPastDateInAtelier(preferredDate)) {
      return res.status(400).json({ success: false, message: 'Appointment date cannot be in the past' });
    }

    // 3. Concurrency Slot Key: ${dateKey}__${timeSlot}
    const normalizedSlot = timeSlot.trim();
    const activeSlotKey = `${dateKey}__${normalizedSlot.toLowerCase()}`;

    // Fast check for active appointment conflict
    const existingConflict = await Appointment.findOne({ activeSlotKey });
    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked on the selected date. Please select an alternate slot.',
      });
    }

    // 4. Create appointment with atomic reservation key
    const appointment = new Appointment({
      user: req.user ? req.user._id : undefined,
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      preferredDate: startOfDay,
      dateKey,
      timeSlot: normalizedSlot,
      activeSlotKey,
      consultType: consultType || 'In-Store Atelier Fitting',
      notes: notes ? notes.trim() : '',
      status: 'Pending',
    });

    let savedAppointment;
    try {
      savedAppointment = await appointment.save();
    } catch (saveErr) {
      // Catch MongoDB unique constraint violation (E11000) under concurrent requests
      if (saveErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'This time slot has already been reserved for the selected date. Please select an alternate slot.',
        });
      }
      throw saveErr;
    }

    // Persist event in outbox for crash recovery
    enqueueOutboxEvent('APPOINTMENT_BOOKED', savedAppointment.email, savedAppointment.toObject(), savedAppointment._id);

    // Trigger transactional email asynchronously
    sendAppointmentStatusEmail(savedAppointment, 'booked').catch((e) =>
      console.error('[Appointment] Email delivery error:', e.message)
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment requested successfully',
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error('[Appointment] Create error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error booking appointment', error: error.message });
  }
};

// @desc    Get customer's appointments
// @route   GET /api/appointments/myappointments
// @access  Private (Customer)
const getMyAppointments = async (req, res) => {
  try {
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const appointments = await Appointment.find({
      $or: [{ user: req.user._id }, { email: userEmail }],
    }).sort({ preferredDate: -1 });

    return res.json({ success: true, appointments });
  } catch (error) {
    console.error('[Appointment] Fetch my appointments error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving appointments' });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private (Owner or Admin)
const getAppointmentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const isOwner =
      req.user &&
      ((appointment.user && appointment.user.toString() === req.user._id.toString()) ||
        appointment.email.toLowerCase() === req.user.email.toLowerCase());
    const isAdmin = req.user && req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this appointment' });
    }

    return res.json({ success: true, appointment });
  } catch (error) {
    console.error('[Appointment] Get by ID error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving appointment' });
  }
};

// @desc    Customer or Admin cancels appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Owner or Admin)
const cancelAppointment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const isOwner =
      req.user &&
      ((appointment.user && appointment.user.toString() === req.user._id.toString()) ||
        appointment.email.toLowerCase() === req.user.email.toLowerCase());
    const isAdmin = req.user && req.user.isAdmin === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Appointment is already marked as ${appointment.status}`,
      });
    }

    appointment.status = 'Cancelled';
    appointment.activeSlotKey = null; // Unsets atomic reservation key, instantly freeing the slot
    if (req.body.reason) {
      appointment.adminNotes = (appointment.adminNotes ? appointment.adminNotes + ' | ' : '') + `Cancelled: ${req.body.reason}`;
    }
    const updated = await appointment.save();

    enqueueOutboxEvent('APPOINTMENT_CANCELLED', updated.email, updated.toObject(), updated._id);

    sendAppointmentStatusEmail(updated, 'cancelled').catch((e) =>
      console.error('[Appointment] Cancel email error:', e.message)
    );

    return res.json({ success: true, message: 'Appointment cancelled successfully', appointment: updated });
  } catch (error) {
    console.error('[Appointment] Cancel error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error cancelling appointment' });
  }
};

// @desc    Get all appointments across business
// @route   GET /api/appointments
// @access  Private/Admin
const getAllAppointments = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.consultType) {
      query.consultType = req.query.consultType;
    }
    if (req.query.date) {
      const { startOfDay, endOfDay, dateKey } = getAtelierDayRange(req.query.date);
      query.$or = [
        { preferredDate: { $gte: startOfDay, $lte: endOfDay } },
        { dateKey },
      ];
    }

    const appointments = await Appointment.find(query)
      .populate('user', 'name email phone')
      .sort({ preferredDate: -1 });

    return res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    console.error('[Appointment] Fetch all appointments error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching appointments' });
  }
};

// @desc    Update appointment status (Admin: Confirm, Reject, Complete)
// @route   PUT /api/appointments/:id/status
// @access  Private/Admin
const updateAppointmentStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const { status, adminNotes } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowed.join(', ')}`,
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = status;
    if (status === 'Cancelled' || status === 'Completed') {
      appointment.activeSlotKey = null; // Free the atomic slot key
    } else if (['Pending', 'Confirmed', 'Rescheduled'].includes(status)) {
      const slot = (appointment.timeSlot || '').trim().toLowerCase();
      appointment.activeSlotKey = `${appointment.dateKey}__${slot}`;
    }

    if (adminNotes !== undefined) {
      appointment.adminNotes = adminNotes.trim();
    }

    let updated;
    try {
      updated = await appointment.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Cannot activate appointment because this slot has already been reserved by another client.',
        });
      }
      throw saveErr;
    }

    const action = status === 'Confirmed' ? 'confirmed' : status === 'Cancelled' ? 'cancelled' : 'rescheduled';
    const eventType = status === 'Confirmed' ? 'APPOINTMENT_CONFIRMED' : status === 'Cancelled' ? 'APPOINTMENT_CANCELLED' : 'APPOINTMENT_RESCHEDULED';
    enqueueOutboxEvent(eventType, updated.email, updated.toObject(), updated._id);

    sendAppointmentStatusEmail(updated, action).catch((e) =>
      console.error('[Appointment] Status update email error:', e.message)
    );

    return res.json({ success: true, message: `Appointment status updated to ${status}`, appointment: updated });
  } catch (error) {
    console.error('[Appointment] Update status error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating appointment status' });
  }
};

// @desc    Reschedule appointment to a new date and time slot
// @route   PUT /api/appointments/:id/reschedule
// @access  Private/Admin
const rescheduleAppointment = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID format' });
    }

    const { preferredDate, timeSlot, adminNotes } = req.body;

    if (!preferredDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Both new preferredDate and timeSlot are required to reschedule',
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Timezone normalization
    let newDateKey, newDayRange;
    try {
      newDayRange = getAtelierDayRange(preferredDate);
      newDateKey = newDayRange.dateKey;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid reschedule appointment date format' });
    }

    if (isPastDateInAtelier(preferredDate)) {
      return res.status(400).json({ success: false, message: 'Reschedule date cannot be in the past' });
    }

    const newNormalizedSlot = timeSlot.trim();
    const newActiveSlotKey = `${newDateKey}__${newNormalizedSlot.toLowerCase()}`;

    // Check conflict on new date/slot
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      activeSlotKey: newActiveSlotKey,
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: 'The requested reschedule slot is already booked on that date.',
      });
    }

    appointment.preferredDate = newDayRange.startOfDay;
    appointment.dateKey = newDateKey;
    appointment.timeSlot = newNormalizedSlot;
    appointment.activeSlotKey = newActiveSlotKey;
    appointment.status = 'Rescheduled';
    if (adminNotes) {
      appointment.adminNotes = adminNotes.trim();
    }

    let updated;
    try {
      updated = await appointment.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'The requested reschedule slot is already booked on that date.',
        });
      }
      throw saveErr;
    }

    enqueueOutboxEvent('APPOINTMENT_RESCHEDULED', updated.email, updated.toObject(), updated._id);

    sendAppointmentStatusEmail(updated, 'rescheduled').catch((e) =>
      console.error('[Appointment] Reschedule email error:', e.message)
    );

    return res.json({ success: true, message: 'Appointment rescheduled successfully', appointment: updated });
  } catch (error) {
    console.error('[Appointment] Reschedule error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error rescheduling appointment' });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
};

