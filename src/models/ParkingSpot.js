const mongoose = require('mongoose');

// Chỗ để xe
const parkingSpotSchema = new mongoose.Schema(
  {
    parkingLotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
    },
    spotNumber: { type: String, required: true },
    type: {
      //chỗ để xe loại x
      // cần khớp với vehicleType trong model Vehicle
      type: String,
      enum: ['compact', 'standard', 'electric'], //có thể sửa thêm
      required: true,
    },
    floor: { type: Number },
    wing: { type: String }, // (optional) khu vực hoặc cánh của bãi đỗ xe (ví dụ: "Cánh A", "Cánh B", hoặc "Khu Đông").
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

parkingSpotSchema.index({ parkingLotId: 1 });

module.exports = mongoose.model(
  'ParkingSpot',
  parkingSpotSchema,
  'parkingspots'
);
