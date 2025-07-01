const mongoose = require('mongoose');

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
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    amount: { type: Number },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({
  parkingSpotId: 1,
  startTime: 1,
  endTime: 1,
  vehicleId: 1,
});

bookingSchema.pre('save', async function (next) {
  // Kiểm tra trùng lặp đặt chỗ
  const overlapping = await mongoose.model('Booking').findOne({
    parkingSpotId: this.parkingSpotId,
    status: 'active',
    $or: [
      { startTime: { $lt: this.endTime }, endTime: { $gt: this.startTime } },
    ],
  });
  if (overlapping) {
    return next(new Error('Chỗ đỗ đã được đặt cho khoảng thời gian này'));
  }

  // Kiểm tra loại xe có khớp với loại chỗ đỗ
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
