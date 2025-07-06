const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const PersonalNotification = require('../models/PersonalNotifications');
const { default: mongoose } = require('mongoose');

// @desc    Get payment details by booking ID
// @route   GET /api/payments/by-booking/:bookingId
// @access  Private (User/Admin/Owner/Staff)
const getPaymentByBookingId = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      bookingId: req.params.bookingId,
      isDeleted: false,
    });
    if (!payment) {
      return res
        .status(404)
        .json({ message: 'Payment not found for this booking.' });
    }

    // Authorization check
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Associated booking not found.' });
    }

    const isAuthorized =
      payment.userId.toString() === req.user._id.toString() || // User viewing their own payment
      req.user.role === 'admin' ||
      (req.user.role === 'parking_owner' &&
        booking.parkingLotId &&
        (
          await mongoose.model('ParkingLot').findById(booking.parkingLotId)
        ).ownerId.toString() === req.user._id.toString()) ||
      (req.user.role === 'staff' &&
        req.user.parkingLotAccess.includes(booking.parkingLotId.toString())); // Assuming parkingLotId is populated or accessible from booking

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this payment.' });
    }

    res.status(200).json(payment);
  } catch (error) {
    next(error);
  }
};

// @desc    Process payment for a booking
// @route   POST /api/payments/process
// @access  Private (User)
const processPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bookingId, paymentMethod, transactionId } = req.body; // transactionId comes from payment gateway

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user._id,
      isDeleted: false,
    }).session(session);
    if (!booking) {
      throw new Error('Booking not found or not owned by user.');
    }

    const payment = await Payment.findOne({
      bookingId,
      isDeleted: false,
    }).session(session);
    if (!payment) {
      throw new Error('Payment record not found for this booking.');
    }
    if (payment.paymentStatus === 'paid') {
      throw new Error('Payment already processed for this booking.');
    }

    // Simulate payment gateway processing
    const isPaymentSuccessful = Math.random() > 0.1; // 90% success rate for demo

    if (isPaymentSuccessful) {
      payment.paymentStatus = 'paid';
      payment.paymentMethod = paymentMethod;
      payment.transactionId =
        transactionId ||
        `TXN_${Date.now()}_${bookingId.toString().substring(0, 5)}`; // Placeholder transaction ID
      payment.paidAt = new Date();
      await payment.save({ session });

      // Update booking status to 'active' if payment is for a pre-booking
      // This is crucial to mark the spot as actively reserved/occupied after payment.
      if (booking.status === 'pending') {
        // Only if it's pending payment
        booking.status = 'active'; // Or 'confirmed'
        await booking.save({ session });
        // No change to ParkingSpot status or availableSpots here if it was set to 'reserved' at booking creation.
      }

      // Send payment success notification
      const notification = new PersonalNotification({
        userId: req.user._id,
        title: 'Payment Successful',
        message: `Your payment of ${payment.amount} VND for booking ${bookingId} has been confirmed.`,
        type: 'payment_success',
        relatedId: payment._id,
      });
      await notification.save({ session });

      await session.commitTransaction();
      res
        .status(200)
        .json({ message: 'Payment processed successfully', payment });
    } else {
      payment.paymentStatus = 'failed';
      await payment.save({ session });

      // Send payment failed notification
      const notification = new PersonalNotification({
        userId: req.user._id,
        title: 'Payment Failed',
        message: `Your payment for booking ${bookingId} has failed. Please try again.`,
        type: 'payment_failed',
        relatedId: payment._id,
      });
      await notification.save({ session });

      await session.abortTransaction(); // Rollback any changes if payment failed
      res.status(400).json({ message: 'Payment failed. Please try again.' });
    }
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get all payments (Admin/Owner - with filtering)
// @route   GET /api/payments
// @access  Private (Admin/Owner)
const getAllPayments = async (req, res, next) => {
  try {
    const { userId, bookingId, paymentStatus, method, startDate, endDate } =
      req.query;
    let query = { isDeleted: false };

    // Role-based filtering
    if (req.user.role === 'user') {
      query.userId = req.user._id; // Users only see their own payments
    } else if (req.user.role === 'parking_owner') {
      // Find bookings associated with parking lots owned by this user
      const ownedParkingLots = await mongoose
        .model('ParkingLot')
        .find({ ownerId: req.user._id })
        .select('_id');
      const ownedLotIds = ownedParkingLots.map((lot) => lot._id);
      const ownedParkingSpots = await mongoose
        .model('ParkingSpot')
        .find({ parkingLotId: { $in: ownedLotIds } })
        .select('_id');
      const ownedParkingSpotIds = ownedParkingSpots.map((spot) => spot._id);
      const ownedBookings = await Booking.find({
        parkingSpotId: { $in: ownedParkingSpotIds },
      }).select('_id');
      const ownedBookingIds = ownedBookings.map((booking) => booking._id);
      query.bookingId = { $in: ownedBookingIds };
    }
    // Admin can view all, so no special query filtering needed for admin here beyond basic query params

    if (userId) query.userId = userId;
    if (bookingId) query.bookingId = bookingId;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (method) query.paymentMethod = method;
    if (startDate || endDate) {
      query.paidAt = {};
      if (startDate) query.paidAt.$gte = new Date(startDate);
      if (endDate) query.paidAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .populate('bookingId', 'startTime endTime status parkingSpotId') // Populate related booking info
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPaymentByBookingId,
  processPayment,
  getAllPayments,
};
