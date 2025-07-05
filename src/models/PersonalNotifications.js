const mongoose = require('mongoose');

const personalNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      // Loại thông báo cá nhân cụ thể
      type: String,
      enum: [
        'booking_confirmation',
        'booking_reminder',
        'booking_cancellation',
        'payment_success',
        'payment_failed',
        'staff_reply',
        'system_alert',
      ],
      required: true,
    },
    status: {
      // Trạng thái của thông báo (đã gửi, đã đọc, v.v.)
      type: String,
      enum: ['new', 'sent', 'read', 'failed'],
      default: 'new',
    },
    relatedId: {
      // ID của đối tượng liên quan (ví dụ: bookingId, paymentId)
      type: mongoose.Schema.Types.ObjectId,
      // Có thể thêm ref cụ thể nếu luôn link đến một model nhất định (ví dụ: ref: 'Booking')
    },
    read: { type: Boolean, default: false }, // Đã đọc hay chưa
    link: { type: String }, // Liên kết nội bộ ứng dụng
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

personalNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
personalNotificationSchema.index({ relatedId: 1 });

const PersonalNotification = mongoose.model(
  'PersonalNotification',
  personalNotificationSchema,
  'personal_notifications'
);

module.exports = PersonalNotification;
