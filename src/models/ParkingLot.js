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
  // Đã thay đổi availableSlots để có giá trị mặc định và được quản lý qua hook
  availableSlots: {
    type: Number,
    default: 0, // Giá trị mặc định
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
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
});

ParkingLotSchema.index({ coordinates: '2dsphere' });
ParkingLotSchema.index({ owner: 1 });

// Hook để tự động gán availableSlots = capacity khi tạo mới ParkingLot
ParkingLotSchema.pre('save', function (next) {
  if (this.isNew) {
    this.availableSlots = this.capacity;
  }
  next();
});



module.exports = mongoose.model('ParkingLot', ParkingLotSchema, 'parkinglots');
