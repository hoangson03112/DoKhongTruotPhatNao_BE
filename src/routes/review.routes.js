const express = require('express');
const {
  addReview,
  getReviewsByParkingLot,
  getReviewById,
  updateReview,
  softDeleteReview,
  getAllReviews,
} = require('../controllers/review.controller');
const { protect, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(protect, addReview)
  .get(protect, authorizeRoles('admin'), getAllReviews); // Admin can get all reviews
router.get('/by-lot/:parkingLotId', getReviewsByParkingLot); // Public
router
  .route('/:id')
  .get(getReviewById) // Public
  .patch(protect, updateReview)
  .delete(protect, softDeleteReview);

module.exports = router;
