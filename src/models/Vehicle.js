const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    licensePlate: {
      //biển số xe
      type: String,
      required: true,
      unique: true,
    },
    vehicleType: {
      //loại xe
      type: String,
      enum: ['compact', 'standard', 'electric'], //có thể sửa thêm
      required: true,
    },
    brand: { type: String }, //hãng xe
    model: { type: String }, //mẫu xe của phương tiện
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

vehicleSchema.index({ userId: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema, 'vehicles');
