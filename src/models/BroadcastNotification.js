const mongoose = require('mongoose');

// ====== Model BroadcastNotification ======
const broadcastNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      // Loại thông báo chung
      type: String,
      enum: [
        'promotion',
        'system_update',
        'general_announcement',
        'parking_lot_news',
      ],
      required: true,
    },
    targetRoles: {
      // Bổ sung: Gửi tới những vai trò nào (ví dụ: ['user', 'parking_owner'])
      type: [String],
      enum: ['user', 'admin', 'parking_owner', 'staff'],
      default: ['user'], // Mặc định gửi tới tất cả user
    },
    filters: {
      // Bổ sung: Các bộ lọc khác (ví dụ: { city: 'Hanoi', vehicleType: 'electric' })
      type: Object, // Lưu dưới dạng object để linh hoạt
    },
    link: { type: String }, // Liên kết nội bộ ứng dụng liên quan đến thông báo
    sentAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }, // Thời gian hết hạn của thông báo (tùy chọn)
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

broadcastNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Tự động xóa sau thời gian hết hạn nếu cần
broadcastNotificationSchema.index({ type: 1, sentAt: -1 });

const BroadcastNotification = mongoose.model(
  'BroadcastNotification',
  broadcastNotificationSchema,
  'broadcast_notifications'
);
