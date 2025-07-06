const mongoose = require('mongoose');

const ParkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
  },
  availableSlots: {
    type: Number,
    required: true,
    min: 0,
  },
  pricing: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pricing',
        required: true,
      },
    ],
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  images: [
    {
      type: String,
      trim: true,
    },
  ],
  suggestedAreas: [
    {
      type: String,
      trim: true, // Gợi ý khu vực đỗ, ví dụ: ["Tầng B1", "Khu vực A"]
      maxlength: [50, 'Suggested area must not exceed 50 characters'],
    },
  ],
  parkingType: {
    type: String,
    enum: ['official', 'unofficial', 'temporary'],
    default: 'official',
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ParkingLotSchema.index({ location: '2dsphere' });
ParkingLotSchema.index({ ownerId: 1 });

module.exports = mongoose.model('ParkingLot', ParkingLotSchema, 'parkinglots');
