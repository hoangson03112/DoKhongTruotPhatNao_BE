const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment must not exceed 500 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ReviewSchema.index({ user: 1 });

const Review = mongoose.model("Review", ReviewSchema, "reviews");
module.exports = Review;
