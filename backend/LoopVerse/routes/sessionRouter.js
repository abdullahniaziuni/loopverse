const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { check } = require('express-validator');
const auth = require('../middleware/auth');

/**
 * Session Routes
 * Contains all endpoints related to mentoring sessions
 */

/**
 * @route POST /api/sessions
 * @desc Book a new session with a mentor
 * @access Private (Learner)
 */
router.post('/', [
  auth,
  check('mentorId', 'Mentor ID is required').notEmpty(),
  check('title', 'Session title is required').notEmpty(),
  check('startTime', 'Valid start time is required').isISO8601(),
  check('duration', 'Duration in minutes is required').isNumeric()
], sessionController.bookSession);

/**
 * @route GET /api/sessions
 * @desc Get all sessions for the current user
 * @access Private
 */
router.get('/', auth, sessionController.getSessions);

/**
 * @route GET /api/sessions/:sessionId
 * @desc Get session by ID
 * @access Private
 */
router.get('/:sessionId', auth, sessionController.getSessionById);

/**
 * @route PUT /api/sessions/:sessionId/status
 * @desc Update session status
 * @access Private
 */
router.put('/:sessionId/status', [
  auth,
  check('status', 'Valid status is required').isIn(['confirmed', 'cancelled', 'completed', 'no-show'])
], sessionController.updateSessionStatus);

/**
 * @route POST /api/sessions/:sessionId/feedback
 * @desc Submit feedback for a session
 * @access Private
 */
router.post('/:sessionId/feedback', [
  auth,
  check('content', 'Feedback content is required').notEmpty(),
  check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 })
], sessionController.submitFeedback);

/**
 * @route POST /api/sessions/:sessionId/meeting-link
 * @desc Generate a meeting link for a session
 * @access Private (Mentor)
 */
router.post('/:sessionId/meeting-link', auth, sessionController.generateMeetingLink);

module.exports = router;