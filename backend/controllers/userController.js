const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { enqueueOutboxEvent } = require('../utils/outboxProcessor');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      !email ||
      !password ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim()
    ) {
      return res.status(400).json({ message: 'Email and password are required and must be valid text strings' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);

      // Support optional HttpOnly cookie in response if configured
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        isAdmin: user.isAdmin,
        token,
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error in authUser:', error.message);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required and must be a valid text string' });
    }

    if (!email || typeof email !== 'string' || !email.trim() || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (phone !== undefined && phone !== null && typeof phone !== 'string') {
      return res.status(400).json({ message: 'Phone must be a valid text string' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      isAdmin: false, // Enforce default customer privilege
    });

    if (user) {
      const token = generateToken(user._id);

      // Enqueue welcome notification in transactional outbox
      enqueueOutboxEvent(
        'WELCOME_EMAIL',
        user.email,
        {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        user._id
      ).catch((err) => {
        console.warn(`[User] Welcome notification enqueue warning for ${user.email}:`, err.message);
      });

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        isAdmin: user.isAdmin,
        token,
      });
    } else {
      return res.status(400).json({ message: 'Invalid user registration data' });
    }
  } catch (error) {
    console.error('Error in registerUser:', error.message);
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (user) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        isAdmin: user.isAdmin,
      });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error.message);
    return res.status(500).json({ message: 'Server error retrieving user profile' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    return res.json(users);
  } catch (error) {
    console.error('Error in getUsers:', error.message);
    return res.status(500).json({ message: 'Server error retrieving users' });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = async (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ message: 'Logged out successfully' });
};

module.exports = {
  authUser,
  registerUser,
  getUserProfile,
  getUsers,
  logoutUser,
};
