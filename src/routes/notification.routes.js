const express = require('express');
const {
  getMyPersonalNotifications,
  markPersonalNotificationAsRead,
  softDeletePersonalNotification,
  createBroadcastNotification,
  getMyBroadcastNotifications,
  markBroadcastNotificationAsRead,
  dismissBroadcastNotification,
  getAllBroadcastNotifications,
  updateBroadcastNotification,
  softDeleteBroadcastNotification,
} = require('../controllers/notification.controller');
const { protect, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Personal Notifications for users
router.get('/personal', protect, getMyPersonalNotifications);
router.patch('/personal/:id/read', protect, markPersonalNotificationAsRead);
router.delete('/personal/:id', protect, softDeletePersonalNotification);

// Broadcast Notifications (Admin management)
router.post(
  '/broadcast',
  protect,
  authorizeRoles('admin'),
  createBroadcastNotification
);
router.get(
  '/broadcast/all',
  protect,
  authorizeRoles('admin'),
  getAllBroadcastNotifications
);
router.patch(
  '/broadcast/:id',
  protect,
  authorizeRoles('admin'),
  updateBroadcastNotification
);
router.delete(
  '/broadcast/:id',
  protect,
  authorizeRoles('admin'),
  softDeleteBroadcastNotification
);

// Broadcast Notifications (User interaction)
router.get('/broadcast/my', protect, getMyBroadcastNotifications); // Get broadcasts visible to current user
router.patch('/broadcast/:id/read', protect, markBroadcastNotificationAsRead); // Mark broadcast as read for user
router.delete('/broadcast/:id/dismiss', protect, dismissBroadcastNotification); // Dismiss broadcast for user

module.exports = router;
