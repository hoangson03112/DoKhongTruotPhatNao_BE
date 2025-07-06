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
      enum: ['compact', 'standard', 'electric', 'motorcycle', 'truck'], //có thể sửa thêm
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      /*
        available: có thể đặt, đỗ xe,
        occupied: đã có xe đang đỗ,
        reserved: đã được đặt trước/giữ chỗ,
        maintenance: đang bảo trì
      */
      default: 'available',
    },
    floor: { type: Number }, // (optional) tầng số (ví dụ: 1, 2, 3, hoặc 4).
    wing: { type: String }, // (optional) khu vực hoặc cánh của bãi đỗ xe (ví dụ: "Cánh A", "Cánh B", hoặc "Khu Đông").
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

parkingSpotSchema.index({ parkingLotId: 1, spotNumber: 1 }, { unique: true }); // Đảm bảo spotNumber duy nhất trong mỗi bãi
parkingSpotSchema.index({ parkingLotId: 1, status: 1 }); // Index để truy vấn nhanh số chỗ trống

module.exports = mongoose.model(
  'ParkingSpot',
  parkingSpotSchema,
  'parkingspots'
);
