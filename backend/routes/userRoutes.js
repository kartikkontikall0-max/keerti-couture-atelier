const express = require('express');
const router = express.Router();
const { authUser, registerUser, getUserProfile, getUsers, logoutUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Apply strict rate limit to auth routes (brute-force protection)
router.route('/').post(authLimiter, registerUser).get(protect, admin, getUsers);
router.post('/login', authLimiter, authUser);
router.post('/logout', logoutUser);
router.route('/profile').get(protect, getUserProfile);

module.exports = router;
