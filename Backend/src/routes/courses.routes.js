const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/course.model');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { storage } = require('../config/firebase');

const router = express.Router();

// Validation middleware
const validateCourse = [
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('level').isIn(['A1', 'A2', 'B1', 'B2', 'C1']),
  body('category').isIn(['medical', 'engineering', 'general'])
];

// Create new course
router.post('/', 
  verifyToken, 
  requireRole(['teacher', 'admin']),
  validateCourse,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const courseData = {
        ...req.body,
        teacher_id: req.user.dbUser.id
      };

      const courseId = await Course.create(courseData);
      const course = await Course.findById(courseId);

      res.status(201).json({
        success: true,
        data: course
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating course',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

// Get all courses with filters
router.get('/', async (req, res) => {
  try {
    const { limit, offset, level, category, search } = req.query;
    const courses = await Course.findAll({
      limit: parseInt(limit) || 10,
      offset: parseInt(offset) || 0,
      level,
      category,
      search
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update course
router.put('/:id',
  verifyToken,
  requireRole(['teacher', 'admin']),
  validateCourse,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Check if user is the course teacher or admin
      if (req.user.dbUser.role !== 'admin' && course.teacher_id !== req.user.dbUser.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this course'
        });
      }

      const success = await Course.update(req.params.id, req.body);
      const updatedCourse = await Course.findById(req.params.id);

      res.json({
        success: true,
        data: updatedCourse
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating course',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

// Delete course
router.delete('/:id',
  verifyToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Check if user is the course teacher or admin
      if (req.user.dbUser.role !== 'admin' && course.teacher_id !== req.user.dbUser.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this course'
        });
      }

      const success = await Course.delete(req.params.id);

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting course',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

// Enroll in course
router.post('/:id/enroll',
  verifyToken,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      await Course.enroll(req.params.id, req.user.dbUser.id);

      res.json({
        success: true,
        message: 'Successfully enrolled in course'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error enrolling in course',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

// Update course progress
router.put('/:id/progress',
  verifyToken,
  body('progress').isInt({ min: 0, max: 100 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const success = await Course.updateProgress(
        req.params.id,
        req.user.dbUser.id,
        req.body.progress
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Enrollment not found'
        });
      }

      res.json({
        success: true,
        message: 'Progress updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating progress',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

// Get course enrollments (teacher/admin only)
router.get('/:id/enrollments',
  verifyToken,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Check if user is the course teacher or admin
      if (req.user.dbUser.role !== 'admin' && course.teacher_id !== req.user.dbUser.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view enrollments'
        });
      }

      const enrollments = await Course.getEnrollments(req.params.id);

      res.json({
        success: true,
        data: enrollments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching enrollments',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
});

module.exports = router; 