const mongoose = require('mongoose');

// Bãi đỗ xe
const parkingLotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    hourlyRate: { type: Number, required: false }, // Giá tiền theo giờ (VNĐ) - dùng để tính toán chi phí đặt chỗ dựa trên thời gian
    /*
    Ví dụ: Nếu hourlyRate là 10.000 VNĐ/giờ, và người dùng đỗ xe từ 10:00 đến 12:00 (2 giờ), 
    tổng chi phí (amount trong Booking) sẽ là 2 * 10.000 = 20.000 VNĐ.
    */
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

parkingLotSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ParkingLot', parkingLotSchema, 'parkinglots');
