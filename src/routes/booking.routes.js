const express = require('express');
const {
  createBooking,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
} = require('../controllers/booking.controller');
const { protect, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

// Tạo booking mới
router.route('/').post(protect, createBooking); // User creates booking

// Lấy lịch sử booking của user
router.get('/', protect, getUserBookings); // User views their bookings

//Lấy chi tiết booking
//Huỷ booking
router
  .route('/:id')
  .get(protect, getBookingDetails)
  .delete(protect, cancelBooking);

module.exports = router;
