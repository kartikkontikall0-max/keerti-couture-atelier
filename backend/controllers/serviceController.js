const mongoose = require('mongoose');
const Service = require('../models/Service');

// @desc    Fetch all services (active for public, all for admin if requested)
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const query = {};
    // If not requested by admin or if activeOnly is specified, filter to active only
    if (req.query.activeOnly === 'true') {
      query.isActive = true;
    }
    const services = await Service.find(query).sort({ price: 1 });
    return res.json(services);
  } catch (error) {
    console.error('[Service] Error fetching services:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving services' });
  }
};

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid service ID format' });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    return res.json(service);
  } catch (error) {
    console.error('[Service] Error fetching service by ID:', error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving service' });
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res) => {
  try {
    const { name, price, description, estimatedTurnaround, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Service name is required' });
    }

    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'A valid non-negative price is required' });
    }

    const service = new Service({
      name: name.trim(),
      price: Number(price),
      description: description ? description.trim() : '',
      estimatedTurnaround: estimatedTurnaround ? estimatedTurnaround.trim() : '24-48 Hours',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    const createdService = await service.save();
    return res.status(201).json(createdService);
  } catch (error) {
    console.error('[Service] Error creating service:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid service ID format' });
    }

    const { name, price, description, estimatedTurnaround, isActive } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: 'Service name cannot be empty' });
      }
      service.name = name.trim();
    }

    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a non-negative number' });
      }
      service.price = Number(price);
    }

    if (description !== undefined) service.description = description.trim();
    if (estimatedTurnaround !== undefined) service.estimatedTurnaround = estimatedTurnaround.trim();
    if (isActive !== undefined) service.isActive = Boolean(isActive);

    const updatedService = await service.save();
    return res.json(updatedService);
  } catch (error) {
    console.error('[Service] Error updating service:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteService = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid service ID format' });
    }

    const deletedService = await Service.findByIdAndDelete(req.params.id);

    if (deletedService) {
      return res.json({ success: true, message: 'Service removed successfully' });
    } else {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
  } catch (error) {
    console.error('[Service] Error deleting service:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
