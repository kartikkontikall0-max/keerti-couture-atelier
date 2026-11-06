const mongoose = require('mongoose');

const designSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Design name is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number'],
  },
  neckStyle: {
    type: String,
    trim: true,
  },
  sleeveType: {
    type: String,
    trim: true,
  },
  backDesign: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String },
    }
  ],
}, {
  timestamps: true,
});

// Compound and text indexes for catalog filtering and searching
designSchema.index({ category: 1, price: 1 });
designSchema.index({ name: 'text', description: 'text', category: 'text' });

const Design = mongoose.model('Design', designSchema);
module.exports = Design;
