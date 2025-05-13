const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/user.model');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { auth } = require('../config/firebase');

const router = express.Router();

// Validation middleware
const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['student', 'teacher', 'admin'])
];

// Create user account (after Firebase authentication)
router.post('/signup', validateSignup, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, role, firebase_uid } = req.body;

    // Check if user already exists
    const existingUser = await User.findByFirebaseUid(firebase_uid);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user in database
    const userId = await User.create({
      firebase_uid,
      email,
      role: role || 'student'
    });

    const user = await User.findByFirebaseUid(firebase_uid);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findByFirebaseUid(req.user.uid);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user profile
router.put('/me', verifyToken, async (req, res) => {
  try {
    const updates = req.body;
    const success = await User.update(req.user.dbUser.id, updates);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Error updating user profile'
      });
    }

    const updatedUser = await User.findByFirebaseUid(req.user.uid);

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin: Get all users
router.get('/users', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { limit, offset, role } = req.query;
    const users = await User.findAll({
      limit: parseInt(limit) || 10,
      offset: parseInt(offset) || 0,
      role
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin: Delete user
router.delete('/users/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const success = await User.delete(req.params.id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 