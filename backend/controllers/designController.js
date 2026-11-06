const mongoose = require('mongoose');
const { v2: cloudinary } = require('cloudinary');
const Design = require('../models/Design');

// @desc    Fetch all designs
// @route   GET /api/designs
// @access  Public
const getDesigns = async (req, res) => {
  try {
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i',
          },
        }
      : {};

    const filter = {};
    if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
    if (req.query.neckStyle) filter.neckStyle = req.query.neckStyle;
    if (req.query.sleeveType) filter.sleeveType = req.query.sleeveType;
    if (req.query.backDesign) filter.backDesign = req.query.backDesign;

    const designs = await Design.find({ ...keyword, ...filter }).sort({ createdAt: -1 });
    return res.json(designs);
  } catch (error) {
    console.error('[Design] Error fetching designs:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch single design
// @route   GET /api/designs/:id
// @access  Public
const getDesignById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid design ID format' });
  }

  try {
    const design = await Design.findById(req.params.id);
    if (design) {
      return res.status(200).json({ success: true, design });
    } else {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }
  } catch (error) {
    console.error(`[Design] Error in GET /api/designs/${req.params.id}:`, error.message);
    return res.status(500).json({ success: false, message: 'Server error retrieving design', error: error.message });
  }
};

// @desc    Create a design
// @route   POST /api/designs
// @access  Private/Admin
const createDesign = async (req, res) => {
  try {
    const { name, price, category, images, description, neckStyle, sleeveType, backDesign } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Design name is required' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    if (price === undefined || price === null || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'A valid non-negative price is required' });
    }
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const design = new Design({
      name: name.trim(),
      price: Number(price),
      category: category.trim(),
      images,
      description: description ? description.trim() : '',
      neckStyle: neckStyle ? neckStyle.trim() : '',
      sleeveType: sleeveType ? sleeveType.trim() : '',
      backDesign: backDesign ? backDesign.trim() : '',
    });

    const createdDesign = await design.save();
    return res.status(201).json(createdDesign);
  } catch (error) {
    console.error('[Design] Error creating design:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a design & clean up Cloudinary images
// @route   DELETE /api/designs/:id
// @access  Private/Admin
const deleteDesign = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid design ID format' });
    }

    const design = await Design.findById(req.params.id);
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    // Best-effort cleanup of associated Cloudinary images to prevent resource leaks
    if (design.images && Array.isArray(design.images)) {
      for (const img of design.images) {
        if (img.public_id && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_api_key') {
          try {
            await cloudinary.uploader.destroy(img.public_id);
            console.log(`[Cloudinary] Cleaned up asset: ${img.public_id}`);
          } catch (cloudErr) {
            console.warn(`[Cloudinary] Asset deletion skipped or failed for ${img.public_id}:`, cloudErr.message);
          }
        }
      }
    }

    await Design.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Design removed successfully' });
  } catch (error) {
    console.error('[Design] Error deleting design:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a design
// @route   PUT /api/designs/:id
// @access  Private/Admin
const updateDesign = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid design ID format' });
    }

    const { name, price, description, images, category, neckStyle, sleeveType, backDesign } = req.body;
    const design = await Design.findById(req.params.id);

    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    if (name !== undefined) design.name = name.trim();
    if (price !== undefined) {
      if (Number(price) < 0) {
        return res.status(400).json({ success: false, message: 'Price cannot be negative' });
      }
      design.price = Number(price);
    }
    if (description !== undefined) design.description = description.trim();
    if (images !== undefined) design.images = images;
    if (category !== undefined) design.category = category.trim();
    if (neckStyle !== undefined) design.neckStyle = neckStyle.trim();
    if (sleeveType !== undefined) design.sleeveType = sleeveType.trim();
    if (backDesign !== undefined) design.backDesign = backDesign.trim();

    const updatedDesign = await design.save();
    return res.json(updatedDesign);
  } catch (error) {
    console.error('[Design] Error updating design:', error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDesigns,
  getDesignById,
  deleteDesign,
  createDesign,
  updateDesign,
};
