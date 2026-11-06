const express = require('express');
const router = express.Router();
const {
  getDesigns,
  getDesignById,
  deleteDesign,
  createDesign,
  updateDesign,
} = require('../controllers/designController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getDesigns).post(protect, admin, createDesign);
router
  .route('/:id')
  .get(getDesignById)
  .delete(protect, admin, deleteDesign)
  .put(protect, admin, updateDesign);

module.exports = router;
