const express = require('express');
const router = express.Router();
const BookingController = require('../controllers/BookingController');

router.post('/', BookingController.createBooking);
router.get('/', BookingController.getBookings);
router.get('/:id', BookingController.getBookingById);

module.exports = router; 