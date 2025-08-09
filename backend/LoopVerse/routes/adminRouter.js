const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

/**
 * Admin Routes
 * Contains all endpoints related to admin operations
 * Most routes require admin authentication
 */

// Authentication Routes
/**
 * @route POST /api/admin/login
 * @desc Authenticate admin & get token
 * @access Public
 */
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
], adminController.login);

// Admin Management Routes (Super Admin only)
/**
 * @route POST /api/admin/create
 * @desc Create a new admin account
 * @access Private - Super Admin only
 */
router.post('/create', [
  adminAuth,
  check('firstName', 'First name is required').notEmpty(),
  check('lastName', 'Last name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
  check('department', 'Department is required').notEmpty()
], adminController.createAdmin);

/**
 * @route PUT /api/admin/permissions/:adminId
 * @desc Update admin permissions
 * @access Private - Super Admin only
 */
router.put('/permissions/:adminId', [
  adminAuth,
  check('role', 'Role is required').notEmpty(),
  check('permissions', 'Permissions are required').isArray()
], adminController.updatePermissions);

// Profile Routes
/**
 * @route GET /api/admin/profile
 * @desc Get current admin profile
 * @access Private
 */
router.get('/profile', adminAuth, adminController.getProfile);

/**
 * @route PUT /api/admin/profile
 * @desc Update admin profile
 * @access Private
 */
router.put('/profile', adminAuth, adminController.updateProfile);

/**
 * @route PUT /api/admin/change-password
 * @desc Change admin password
 * @access Private
 */
router.put('/change-password', [
  adminAuth,
  check('newPassword', 'New password must be at least 8 characters').isLength({ min: 8 })
], adminController.changePassword);

// User Management Routes
/**
 * @route GET /api/admin/users
 * @desc Get all users (paginated)
 * @access Private
 */
router.get('/users', adminAuth, adminController.getAllUsers);

/**
 * @route GET /api/admin/users/:userId
 * @desc Get detailed user information
 * @access Private
 */
router.get('/users/:userId', adminAuth, adminController.getUserDetails);

/**
 * @route PUT /api/admin/users/:userId/status
 * @desc Activate or deactivate a user account
 * @access Private
 */
router.put('/users/:userId/status', [
  adminAuth,
  check('isActive', 'isActive status is required').isBoolean(),
  check('role', 'User role is required').isIn(['Learner', 'Mentor', 'Admin'])
], adminController.updateUserStatus);

// Mentor Verification Routes
/**
 * @route GET /api/admin/mentors/pending
 * @desc Get all pending mentor verification requests
 * @access Private
 */
router.get('/mentors/pending', adminAuth, adminController.getPendingMentors);

/**
 * @route PUT /api/admin/mentors/:mentorId/verify
 * @desc Approve or reject a mentor
 * @access Private
 */
router.put('/mentors/:mentorId/verify', [
  adminAuth,
  check('isVerified', 'isVerified status is required').isBoolean()
], adminController.verifyMentor);

// Dashboard and Analytics Routes
/**
 * @route GET /api/admin/dashboard
 * @desc Get dashboard statistics
 * @access Private
 */
router.get('/dashboard', adminAuth, adminController.getDashboardStats);

/**
 * @route GET /api/admin/logs
 * @desc Get admin action logs
 * @access Private - Higher level admins only
 */
router.get('/logs', adminAuth, adminController.getActionLogs);

// Enhanced Dashboard Statistics Route
/**
 * @route GET /api/admin/dashboard/enhanced
 * @desc Get enhanced dashboard statistics with sessions and ratings
 * @access Private
 */
router.get('/dashboard/enhanced', adminAuth, adminController.getDashboardEnhanced);

// Content Moderation Routes
/**
 * @route PUT /api/admin/reviews/:reviewId/moderate
 * @desc Moderate a review (approve/reject/delete)
 * @access Private
 */
router.put('/reviews/:reviewId/moderate', [
  adminAuth,
  check('action', 'Action is required').isIn(['approve', 'reject', 'delete'])
], adminController.moderateReview);

/**
 * @route GET /api/admin/reports
 * @desc Get list of user reports
 * @access Private
 */
router.get('/reports', adminAuth, adminController.getReports);

/**
 * @route PUT /api/admin/reports/:reportId
 * @desc Handle a specific report
 * @access Private
 */
router.put('/reports/:reportId', [
  adminAuth,
  check('action', 'Action is required').isIn(['resolved', 'rejected', 'pending'])
], adminController.handleReport);

// Data Export Routes
/**
 * @route GET /api/admin/export/users
 * @desc Export users data as CSV
 * @access Private
 */
router.get('/export/users', adminAuth, adminController.exportUsers);

/**
 * @route GET /api/admin/export/sessions
 * @desc Export sessions data as CSV
 * @access Private
 */
router.get('/export/sessions', adminAuth, adminController.exportSessions);

module.exports = router;