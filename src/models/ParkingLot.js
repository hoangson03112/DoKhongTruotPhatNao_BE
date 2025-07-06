const mongoose = require("mongoose");

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
        ref: "Pricing",
        required: true,
      },
    ],
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
    enum: ["official", "unofficial", "temporary"],
    default: "official",
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ParkingLotSchema.index({ location: "2dsphere" });
ParkingLotSchema.index({ ownerId: 1 });

module.exports = mongoose.model("ParkingLot", ParkingLotSchema, "parkinglots");
