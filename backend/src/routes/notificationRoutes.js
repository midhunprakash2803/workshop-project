const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead
} = require('../controllers/notificationController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.get('/', authenticateJWT, getUserNotifications);
router.put('/:id/read', authenticateJWT, markAsRead);
router.put('/read-all', authenticateJWT, markAllAsRead);

module.exports = router;
