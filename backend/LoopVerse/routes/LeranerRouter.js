const express = require('express');
const router = express.Router();
const learnerController = require('../controllers/leranerController');
const { check } = require('express-validator');
const auth = require('../middleware/auth');

/**
 * Learner Routes
 * Contains all endpoints related to learner operations
 */

// Authentication Routes
/**
 * @route POST /api/learners/register
 * @desc Register a new learner
 * @access Public
 */
router.post('/register', [
  // Validation middleware
  check('firstName', 'First name is required').notEmpty(),
  check('lastName', 'Last name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 })
], learnerController.register);

/**
 * @route POST /api/learners/login
 * @desc Authenticate learner & get token
 * @access Public
 */
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], learnerController.login);

// Profile Routes
/**
 * @route GET /api/learners/profile
 * @desc Get current learner profile
 * @access Private
 */
router.get('/profile', auth, learnerController.getProfile);

/**
 * @route GET /api/learners/profile/:id
 * @desc Get learner profile by ID
 * @access Private
 */
router.get('/profile/:id', auth, learnerController.getProfile);

/**
 * @route PUT /api/learners/profile
 * @desc Update learner profile
 * @access Private
 */
router.put('/profile', auth, learnerController.updateProfile);

/**
 * @route PUT /api/learners/change-password
 * @desc Change learner password
 * @access Private
 */
router.put('/change-password', [
  auth,
  check('currentPassword', 'Current password is required').notEmpty(),
  check('newPassword', 'New password must be at least 6 characters long').isLength({ min: 6 })
], learnerController.changePassword);

// Course Enrollment Routes
/**
 * @route POST /api/learners/enroll
 * @desc Enroll in a course
 * @access Private
 */
router.post('/enroll', [
  auth,
  check('courseId', 'Course ID is required').notEmpty()
], learnerController.enrollCourse);

/**
 * @route PUT /api/learners/progress
 * @desc Update course progress
 * @access Private
 */
router.put('/progress', [
  auth,
  check('courseId', 'Course ID is required').notEmpty(),
  check('progress', 'Progress percentage is required').isNumeric()
], learnerController.updateProgress);

/**
 * @route GET /api/learners/courses
 * @desc Get all enrolled courses
 * @access Private
 */
router.get('/courses', auth, learnerController.getEnrolledCourses);

// Goal Management Routes
/**
 * @route POST /api/learners/goals
 * @desc Add or update a goal
 * @access Private
 */
router.post('/goals', [
  auth,
  check('description', 'Goal description is required').notEmpty()
], learnerController.manageGoal);

/**
 * @route DELETE /api/learners/goals/:goalId
 * @desc Delete a goal
 * @access Private
 */
router.delete('/goals/:goalId', auth, learnerController.deleteGoal);

// Statistics Routes
/**
 * @route GET /api/learners/stats
 * @desc Get learner progress statistics
 * @access Private
 */
router.get('/stats', auth, learnerController.getProgressStats);

// Account Management
/**
 * @route PUT /api/learners/deactivate
 * @desc Deactivate learner account
 * @access Private
 */
router.put('/deactivate', auth, learnerController.deactivateAccount);

module.exports = router;