const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth.middleware');
const { firestore } = require('../config/firebase');
const Course = require('../models/course.model');

const router = express.Router();

// Get chat messages for a course
router.get('/:courseId', verifyToken, async (req, res) => {
  try {
    // Check if user is enrolled in the course
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get messages from Firestore
    const messagesRef = firestore.collection(`course_chat/${req.params.courseId}/messages`);
    const snapshot = await messagesRef
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send a message in course chat
router.post('/:courseId',
  verifyToken,
  body('message').trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Check if user is enrolled in the course
      const course = await Course.findById(req.params.courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Create message in Firestore
      const messageRef = firestore.collection(`course_chat/${req.params.courseId}/messages`).doc();
      await messageRef.set({
        message: req.body.message,
        sender_id: req.user.dbUser.id,
        sender_email: req.user.dbUser.email,
        sender_role: req.user.dbUser.role,
        timestamp: firestore.FieldValue.serverTimestamp()
      });

      res.status(201).json({
        success: true,
        data: {
          id: messageRef.id,
          message: req.body.message,
          sender_id: req.user.dbUser.id,
          sender_email: req.user.dbUser.email,
          sender_role: req.user.dbUser.role
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending message',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

// Delete a message (sender or admin only)
router.delete('/:courseId/messages/:messageId',
  verifyToken,
  async (req, res) => {
    try {
      const messageRef = firestore
        .collection(`course_chat/${req.params.courseId}/messages`)
        .doc(req.params.messageId);

      const message = await messageRef.get();
      if (!message.exists) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      const messageData = message.data();
      if (messageData.sender_id !== req.user.dbUser.id && req.user.dbUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this message'
        });
      }

      await messageRef.delete();

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting message',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

module.exports = router; 