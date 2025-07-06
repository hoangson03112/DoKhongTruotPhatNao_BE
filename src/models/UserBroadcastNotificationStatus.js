const mongoose = require('mongoose');
const BroadcastNotification = require('./BroadcastNotification');

// ====== Model UserNotificationStatus (Trạng thái đã đọc của người dùng đối với BroadcastNotification) ======
const userNotificationStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    broadcastNotificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BroadcastNotification',
      required: true,
    },
    read: { type: Boolean, default: false }, // Trạng thái đã đọc
    dismissedAt: { type: Date }, // Thời điểm người dùng chủ động ẩn/xóa thông báo này khỏi danh sách của họ
    isDeleted: { type: Boolean, default: false }, // Có thể soft delete nếu người dùng muốn ẩn hẳn thông báo broadcast
    deletedAt: { type: Date },
  },
  { timestamps: true }
);
userNotificationStatusSchema.index(
  { userId: 1, broadcastNotificationId: 1 },
  { unique: true }
); // Đảm bảo mỗi người dùng chỉ có 1 bản ghi trạng thái cho 1 broadcast
userNotificationStatusSchema.index({ broadcastNotificationId: 1 });

const UserNotificationStatus = mongoose.model(
  'UserNotificationStatus',
  userNotificationStatusSchema,
  'user_notification_statuses'
);

module.exports = {
  BroadcastNotification,
  UserNotificationStatus,
};
