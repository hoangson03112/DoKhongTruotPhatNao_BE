const mongoose = require('mongoose');

// Bãi đỗ xe
const parkingLotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    address: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    totalSpots: { type: Number, required: true, min: 0, default: 0 }, // Số chỗ để xe của bãi đỗ
    availableSpots: { type: Number, required: true, min: 0, default: 0 },
    imageUrls: { type: [String] },
    contactPhone: { type: String },
    contactEmail: { type: String },
    /*
    Ví dụ: Nếu hourlyRate là 10.000 VNĐ/giờ, và người dùng đỗ xe từ 10:00 đến 12:00 (2 giờ), 
    tổng chi phí (amount trong Booking) sẽ là 2 * 10.000 = 20.000 VNĐ.
    */
    hourlyRate: { type: Number, required: true, min: 0 }, // Giá tiền theo giờ (VNĐ) - dùng để tính toán chi phí đặt chỗ dựa trên thời gian
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    openingHours: [
      //Mô tả theo từng khung giờ của các ngày trong tuần
      {
        dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 for Monday, 6 for Sunday
        openTime: { type: String, match: /^\d{2}:\d{2}$/ }, // HH:MM
        closeTime: { type: String, match: /^\d{2}:\d{2}$/ }, // HH:MM
        isClosed: { type: Boolean, default: false },
      },
    ],
    /*
      --------Cách khác - dùng Map--------

      openingHours: { // Bổ sung
      type: Map,
      of: new mongoose.Schema({
        open: { type: String }, // 'HH:MM'
        close: { type: String }, // 'HH:MM'
        isClosed: { type: Boolean, default: false }
      }, { _id: false }),
    }, // Map để lưu giờ mở cửa cho từng ngày
    */

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

parkingLotSchema.index({ location: '2dsphere' });
parkingLotSchema.index({ ownerId: 1 });

module.exports = mongoose.model('ParkingLot', parkingLotSchema, 'parkinglots');
