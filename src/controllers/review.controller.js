const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ParkingLot = require('../models/ParkingLot');

// @desc    Add a new review for a parking lot
// @route   POST /api/reviews
// @access  Private (User)
const addReview = async (req, res, next) => {
  try {
    const { parkingLotId, rating, comment } = req.body;

    // Check if user has completed a booking for this parking lot
    // This is a common business rule to ensure reviews are from actual users.
    const hasBooked = await Booking.findOne({
      user: req.user._id,
      parkingLot: parkingLotId,
      status: 'completed',
    });

    if (!hasBooked) {
      return res.status(403).json({
        message:
          'You must have a completed booking at this parking lot to leave a review.',
      });
    }

    // Check if user already reviewed this parking lot
    const existingReview = await Review.findOne({
      userId: req.user._id,
      parkingLotId,
      isDeleted: false,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: 'You have already reviewed this parking lot.' });
    }

    const newReview = new Review({
      userId: req.user._id,
      parkingLotId,
      rating,
      comment,
    });

    const createdReview = await newReview.save();
    res.status(201).json(createdReview);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a specific parking lot
// @route   GET /api/reviews/by-lot/:parkingLotId
// @access  Public
const getReviewsByParkingLot = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      parkingLotId: req.params.parkingLotId,
      isDeleted: false,
    }).populate('userId', 'username avatar'); // Populate user info to show who reviewed
    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single review by ID
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('userId', 'username avatar')
      .populate('parkingLotId', 'name address');
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json(review);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PATCH /api/reviews/:id
// @access  Private (User)
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    // Only allow the user who created the review to update it
    if (review.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this review' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    const updatedReview = await review.save();
    res.status(200).json(updatedReview);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (User/Admin)
const softDeleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Allow owner of review or admin to delete
    if (
      review.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this review' });
    }

    review.isDeleted = true;
    review.deletedAt = new Date();
    await review.save();
    res.status(200).json({ message: 'Review soft deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews
// @access  Private (Admin)
const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isDeleted: false })
      .populate('userId', 'username email')
      .populate('parkingLotId', 'name address');
    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addReview,
  getReviewsByParkingLot,
  getReviewById,
  updateReview,
  softDeleteReview,
  getAllReviews,
};
