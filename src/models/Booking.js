const mongoose = require('mongoose');

// Lượt đặt chỗ / để xe (có thể đặt trước)
const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    parkingSpotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    //Khoảng thời gian start - end đặt chỗ trước
    startTime: { type: Date },
    endTime: { type: Date },
    //Thời gian checkin - checkout thực tế (nếu có)
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'cancelled', 'completed'],
      default: 'pending',
    },
    overtimeFee: {
      //Phí phát sinh nếu quá giờ
      type: Number,
      default: 0,
    },
    paymentId: {
      type: String,
      default: null,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({
  parkingSpotId: 1,
  vehicleId: 1,
});
bookingSchema.index({ userId: 1, status: 1 });

bookingSchema.pre('save', async function (next) {
  // Logic kiểm tra trùng lặp và loại xe (vẫn giữ nguyên và quan trọng)
  // 1. Kiểm tra trùng lặp đặt chỗ cho cùng một chỗ đỗ trong khoảng thời gian này
  const overlapping = await mongoose.model('Booking').findOne({
    parkingSpotId: this.parkingSpotId,
    // Chỉ kiểm tra với các booking đang active hoặc pending
    status: { $in: ['pending'] },
    $or: [
      { startTime: { $lt: this.endTime }, endTime: { $gt: this.startTime } },
    ],
    _id: { $ne: this._id }, // Loại trừ chính bản thân booking đang được lưu (khi update)
  });
  if (overlapping) {
    return next(new Error('Chỗ đỗ đã được đặt cho khoảng thời gian này'));
  }

  // 2. Kiểm tra loại xe có khớp với loại chỗ đỗ
  const vehicle = await mongoose.model('Vehicle').findById(this.vehicleId);
  const parkingSpot = await mongoose
    .model('ParkingSpot')
    .findById(this.parkingSpotId);
  if (!vehicle || !parkingSpot) {
    return next(new Error('Phương tiện hoặc chỗ đỗ không tồn tại'));
  }
  if (vehicle.vehicleType !== parkingSpot.type) {
    return next(new Error('Loại xe không khớp với loại chỗ đỗ'));
  }

  next();
});

module.exports = mongoose.model('Booking', bookingSchema, 'bookings');
