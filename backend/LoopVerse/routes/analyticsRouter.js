const express = require('express');
const router = express.Router();

// ✅ Correct path and destructuring for named exports
const {
  getOverallProgress,
  getUserProgress,
  addAnalyticsEvent
} = require('../controllers/analyticsController');

router.get('/progress', getOverallProgress);
router.get('/user-progress/:userId', getUserProgress);
router.post('/event', addAnalyticsEvent);

module.exports = router;
