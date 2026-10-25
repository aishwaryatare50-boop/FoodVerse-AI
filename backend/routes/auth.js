const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

const router = express.Router();

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toSafeObject(),
  });
};

// @route  POST /api/auth/register
// @desc   Register user with email/password
// @access Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      const user = await User.create({ name, email, password });

      sendTokenResponse(user, 201, res);
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route  POST /api/auth/login
// @desc   Login with email/password
// @access Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (!user.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });

      sendTokenResponse(user, 200, res);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// @route  GET /api/auth/me
// @desc   Get current logged-in user
// @access Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route  PUT /api/auth/profile
// @desc   Update user dietary profile
// @access Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, dietaryProfile } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (dietaryProfile) updateData.dietaryProfile = dietaryProfile;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
