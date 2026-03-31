const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, role, tenantId } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists.' });
    }

    // Create user — generate a tenantId if not provided
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'editor',
      tenantId: tenantId || uuidv4(),
    });

    // Generate token
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.json({
      message: 'Login successful.',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getProfile };
