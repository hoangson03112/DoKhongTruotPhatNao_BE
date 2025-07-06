const PersonalNotification = require('../models/PersonalNotifications');
const {
  BroadcastNotification,
  UserNotificationStatus,
} = require('../models/UserBroadcastNotificationStatus');
const User = require('../models/User'); // Import User model

// @desc    Get all personal notifications for authenticated user
// @route   GET /api/notifications/personal
// @access  Private (User)
const getMyPersonalNotifications = async (req, res, next) => {
  try {
    const notifications = await PersonalNotification.find({
      userId: req.user._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a personal notification as read
// @route   PATCH /api/notifications/personal/:id/read
// @access  Private (User)
const markPersonalNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await PersonalNotification.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    });
    if (!notification) {
      return res
        .status(404)
        .json({ message: 'Personal Notification not found' });
    }
    notification.read = true;
    const updatedNotification = await notification.save();
    res.status(200).json(updatedNotification);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a personal notification
// @route   DELETE /api/notifications/personal/:id
// @access  Private (User)
const softDeletePersonalNotification = async (req, res, next) => {
  try {
    const notification = await PersonalNotification.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false,
    });
    if (!notification) {
      return res
        .status(404)
        .json({ message: 'Personal Notification not found' });
    }
    notification.isDeleted = true;
    notification.deletedAt = new Date();
    await notification.save();
    res
      .status(200)
      .json({ message: 'Personal Notification soft deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a broadcast notification (Admin only)
// @route   POST /api/notifications/broadcast
// @access  Private (Admin)
const createBroadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetRoles, filters, link, expiresAt } =
      req.body;
    const newBroadcast = new BroadcastNotification({
      title,
      message,
      type,
      targetRoles: targetRoles || ['user'], // Default to 'user' role
      filters,
      link,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    const createdBroadcast = await newBroadcast.save();

    // No need to create UserNotificationStatus records here, they will be created on access/read.
    res.status(201).json(createdBroadcast);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all broadcast notifications visible to the authenticated user
// @route   GET /api/notifications/broadcast/my
// @access  Private (All roles)
const getMyBroadcastNotifications = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const now = new Date();

    // Find all active broadcast notifications relevant to the user's role
    const relevantBroadcasts = await BroadcastNotification.find({
      isDeleted: false,
      $or: [
        { targetRoles: userRole }, // Matches the user's role
        { targetRoles: [] }, // If targetRoles is empty, assume it's for everyone
      ],
      $or: [
        { expiresAt: { $gte: now } }, // Not expired yet
        { expiresAt: null }, // No expiration set
      ],
    }).sort({ sentAt: -1 });

    // Get read statuses for these broadcasts for the current user
    const broadcastIds = relevantBroadcasts.map((b) => b._id);
    const userStatuses = await UserNotificationStatus.find({
      userId,
      broadcastNotificationId: { $in: broadcastIds },
      isDeleted: false,
    });

    const statusMap = new Map();
    userStatuses.forEach((status) => {
      statusMap.set(status.broadcastNotificationId.toString(), status.read);
    });

    // Combine broadcast details with user's read status
    const notificationsWithReadStatus = relevantBroadcasts.map((broadcast) => ({
      ...broadcast.toObject(),
      read: statusMap.get(broadcast._id.toString()) || false,
      // Include UserNotificationStatus _id for marking read/dismissed
      userNotificationStatusId: userStatuses.find((s) =>
        s.broadcastNotificationId.equals(broadcast._id)
      )?._id,
    }));

    res.status(200).json(notificationsWithReadStatus);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a broadcast notification as read for a specific user
// @route   PATCH /api/notifications/broadcast/:id/read
// @access  Private (User)
const markBroadcastNotificationAsRead = async (req, res, next) => {
  try {
    const broadcastNotificationId = req.params.id;
    const userId = req.user._id;

    // Find or create UserNotificationStatus record
    const statusRecord = await UserNotificationStatus.findOneAndUpdate(
      { userId, broadcastNotificationId },
      { read: true },
      { upsert: true, new: true, runValidators: true } // Create if not exists, return new doc
    );

    res.status(200).json({
      message: 'Broadcast notification marked as read.',
      statusRecord,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Dismiss (soft delete) a broadcast notification for a specific user
// @route   DELETE /api/notifications/broadcast/:id/dismiss
// @access  Private (User)
const dismissBroadcastNotification = async (req, res, next) => {
  try {
    const broadcastNotificationId = req.params.id;
    const userId = req.user._id;

    const statusRecord = await UserNotificationStatus.findOneAndUpdate(
      { userId, broadcastNotificationId },
      { isDeleted: true, deletedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!statusRecord) {
      return res
        .status(404)
        .json({ message: 'Broadcast Notification status for user not found.' });
    }

    res
      .status(200)
      .json({ message: 'Broadcast notification dismissed.', statusRecord });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all broadcast notifications (Admin only)
// @route   GET /api/notifications/broadcast/all
// @access  Private (Admin)
const getAllBroadcastNotifications = async (req, res, next) => {
  try {
    const broadcasts = await BroadcastNotification.find({
      isDeleted: false,
    }).sort({ sentAt: -1 });
    res.status(200).json(broadcasts);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a broadcast notification (Admin only)
// @route   PATCH /api/notifications/broadcast/:id
// @access  Private (Admin)
const updateBroadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetRoles, filters, link, expiresAt } =
      req.body;
    const broadcast = await BroadcastNotification.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!broadcast) {
      return res
        .status(404)
        .json({ message: 'Broadcast Notification not found' });
    }

    broadcast.title = title || broadcast.title;
    broadcast.message = message || broadcast.message;
    broadcast.type = type || broadcast.type;
    broadcast.targetRoles = targetRoles || broadcast.targetRoles;
    broadcast.filters = filters || broadcast.filters;
    broadcast.link = link || broadcast.link;
    if (expiresAt) broadcast.expiresAt = new Date(expiresAt);

    const updatedBroadcast = await broadcast.save();
    res.status(200).json(updatedBroadcast);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a broadcast notification (Admin only)
// @route   DELETE /api/notifications/broadcast/:id
// @access  Private (Admin)
const softDeleteBroadcastNotification = async (req, res, next) => {
  try {
    const broadcast = await BroadcastNotification.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!broadcast) {
      return res
        .status(404)
        .json({ message: 'Broadcast Notification not found' });
    }
    broadcast.isDeleted = true;
    broadcast.deletedAt = new Date();
    await broadcast.save();

    // Also soft delete all associated UserNotificationStatus records
    await UserNotificationStatus.updateMany(
      { broadcastNotificationId: broadcast._id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    res
      .status(200)
      .json({ message: 'Broadcast Notification soft deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
