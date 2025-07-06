const express = require('express');
const {
  getPaymentByBookingId,
  processPayment,
  getAllPayments,
} = require('../controllers/payment.controller');
const { protect, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.post('/process', protect, processPayment); // User processes payment
router.get('/by-booking/:bookingId', protect, getPaymentByBookingId); // User/Admin/Owner/Staff view specific payment
router.get(
  '/',
  protect,
  authorizeRoles('admin', 'parking_owner'),
  getAllPayments
); // Admin/Owner view all/filtered payments

module.exports = router;
