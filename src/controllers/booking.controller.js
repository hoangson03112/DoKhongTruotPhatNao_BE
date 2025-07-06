const Booking = require('../models/Booking');
const ParkingLot = require('../models/ParkingLot');
// const Payment = require('../models/Payment');
const PersonalNotification = require('../models/PersonalNotifications');
const { default: mongoose } = require('mongoose');
const queueService = require('../utils/queueService'); // Import the queue service

// Helper to calculate booking amount
const calculateAmount = (hourlyRate, startTime, endTime) => {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Round up to nearest hour
  return durationHours * hourlyRate;
};

// @desc    Create a new booking (pre-booking)
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { parkingSpotId, vehicleId, startTime, endTime } = req.body;

    // Basic validation
    if (!parkingSpotId || !vehicleId || !startTime || !endTime) {
      throw new Error('Missing required booking fields.');
    }
    if (new Date(startTime) >= new Date(endTime)) {
      throw new Error('Start time must be before end time.');
    }
    if (new Date(startTime) < new Date()) {
      throw new Error('Booking start time cannot be in the past.');
    }

    const parkingSpot = await ParkingSpot.findOne({
      _id: parkingSpotId,
      isDeleted: false,
    }).session(session);
    if (!parkingSpot) {
      throw new Error('Parking Spot not found or is deleted.');
    }
    if (parkingSpot.status !== 'available') {
      throw new Error('Parking Spot is not available or not bookable.');
    }

    const parkingLot = await ParkingLot.findById(
      parkingSpot.parkingLotId
    ).session(session);
    if (!parkingLot) {
      throw new Error('Associated Parking Lot not found.');
    }

    // Calculate initial amount
    const amount = calculateAmount(
      parkingLot.hourlyRate,
      new Date(startTime),
      new Date(endTime)
    );

    const newBooking = new Booking({
      userId: req.user._id,
      parkingSpotId,
      vehicleId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: 'pending', // Awaiting payment/confirmation
      amount,
    });

    // Mongoose pre-save hook will handle overlapping check and vehicle type check
    const createdBooking = await newBooking.save({ session });

    // Update ParkingSpot status to 'reserved' and decrement availableSpots via queue
    // This makes the spot unavailable for other bookings immediately.
    await ParkingSpot.findByIdAndUpdate(
      parkingSpotId,
      { status: 'reserved' },
      { new: true, session }
    );
    // Add job to queue for atomic availableSpots update
    queueService.addJob('decrementAvailableSpots', {
      parkingLotId: parkingLot._id,
      parkingSpotId,
    });

    // Create a pending payment record
    // const newPayment = new Payment({
    //   bookingId: createdBooking._id,
    //   userId: req.user._id,
    //   amount: createdBooking.amount,
    //   paymentStatus: 'pending',
    // });
    // const createdPayment = await newPayment.save({ session });

    // // Link payment to booking
    // createdBooking.paymentId = createdPayment._id;
    // await createdBooking.save({ session });

    // Send notification to user (e.g., booking confirmation)
    const notification = new PersonalNotification({
      userId: req.user._id,
      title: 'Booking Confirmation',
      message: `Your booking for spot ${parkingSpot.spotNumber} at ${parkingLot.name} is pending payment. Amount: ${amount} VND.`,
      type: 'booking_confirmation',
      relatedId: createdBooking._id,
    });
    await notification.save({ session });

    await session.commitTransaction();
    // res.status(201).json({ booking: createdBooking, payment: createdPayment });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get all bookings for the authenticated user
// @route   GET /api/bookings/my
// @access  Private (User)
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      userId: req.user._id,
      isDeleted: false,
    })
      .populate('parkingSpotId')
      .populate('vehicleId')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (User/Admin/Staff)
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('userId', 'name email phone')
      .populate('parkingSpotId')
      .populate('vehicleId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization: User can view their own booking. Admin/Staff/Owner can view any.
    const parkingLot = await ParkingLot.findById(
      booking.parkingSpotId.parkingLotId
    );
    const isAuthorized =
      booking.userId.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      (req.user.role === 'parking_owner' &&
        parkingLot &&
        parkingLot.ownerId.toString() === req.user._id.toString()) ||
      (req.user.role === 'staff' &&
        req.user.parkingLotAccess.includes(parkingLot._id.toString())); // Assuming staff has parkingLotAccess array

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this booking' });
    }

    res.status(200).json(booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private (User/Admin/Staff/Owner)
const cancelBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);

    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new Error('Booking cannot be cancelled in its current status.');
    }

    // Authorization
    const parkingSpot = await ParkingSpot.findById(
      booking.parkingSpotId
    ).session(session);
    const parkingLot = await ParkingLot.findById(
      parkingSpot.parkingLotId
    ).session(session);

    const isAuthorized =
      booking.userId.toString() === req.user._id.toString() || // User cancelling their own booking
      req.user.role === 'admin' ||
      (req.user.role === 'parking_owner' &&
        parkingLot &&
        parkingLot.ownerId.toString() === req.user._id.toString()) ||
      (req.user.role === 'staff' &&
        req.user.parkingLotAccess.includes(parkingLot._id.toString()));

    if (!isAuthorized) {
      throw new Error('Not authorized to cancel this booking.');
    }

    booking.status = 'cancelled';
    await booking.save({ session });

    // Update ParkingSpot status to 'available' and increment availableSpots via queue
    await ParkingSpot.findByIdAndUpdate(
      booking.parkingSpotId,
      { status: 'available' },
      { new: true, session }
    );
    queueService.addJob('incrementAvailableSpots', {
      parkingLotId: parkingSpot.parkingLotId,
      parkingSpotId: booking.parkingSpotId,
    });

    // Update payment status if needed (e.g., refund)
    // const payment = await Payment.findById(booking.paymentId).session(session);
    // if (payment && payment.paymentStatus === 'paid') {
    //   payment.paymentStatus = 'refunded'; // Or 'pending_refund'
    //   await payment.save({ session });
    //   // TODO: Trigger actual refund process if integrated with payment gateway
    // }

    // Send cancellation notification
    const notification = new PersonalNotification({
      userId: booking.userId,
      title: 'Booking Cancelled',
      message: `Your booking for spot ${parkingSpot.spotNumber} at ${parkingLot.name} has been cancelled.`,
      type: 'booking_cancellation',
      relatedId: booking._id,
    });
    await notification.save({ session });

    await session.commitTransaction();
    res
      .status(200)
      .json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Handle vehicle check-in (Staff/Owner/Admin)
// @route   PATCH /api/bookings/:id/checkin
// @access  Private (Staff/Owner/Admin)
const checkInVehicle = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (booking.checkInTime) {
      throw new Error('Vehicle already checked in.');
    }
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      throw new Error('Cannot check in a cancelled or completed booking.');
    }

    // Authorization check (staff/owner/admin)
    const parkingSpot = await ParkingSpot.findById(
      booking.parkingSpotId
    ).session(session);
    const parkingLot = await ParkingLot.findById(
      parkingSpot.parkingLotId
    ).session(session);

    const isAuthorized =
      req.user.role === 'admin' ||
      (req.user.role === 'parking_owner' &&
        parkingLot &&
        parkingLot.ownerId.toString() === req.user._id.toString()) ||
      (req.user.role === 'staff' &&
        req.user.parkingLotAccess.includes(parkingLot._id.toString()));

    if (!isAuthorized) {
      throw new Error('Not authorized to check in this vehicle.');
    }

    booking.checkInTime = new Date();
    // Update booking status if it was pending and check-in happens
    // This logic might need refinement based on your payment flow.
    // If payment is always upfront, it would be 'paid' then 'active'.
    // If pay on exit, it remains 'pending' then 'active'.
    // For simplicity here, we assume a successful check-in makes it 'active'.
    // If you have a payment step, you might check paymentStatus === 'paid' here.
    booking.status = 'active';

    await booking.save({ session });

    // Update ParkingSpot status from 'reserved' to 'occupied'
    await ParkingSpot.findByIdAndUpdate(
      booking.parkingSpotId,
      { status: 'occupied' },
      { new: true, session }
    );
    // availableSpots should already be decremented when booking was created (reserved)
    // No change to availableSpots count here, just status of spot.

    await session.commitTransaction();
    res
      .status(200)
      .json({ message: 'Vehicle checked in successfully', booking });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Handle vehicle check-out (Staff/Owner/Admin)
// @route   PATCH /api/bookings/:id/checkout
// @access  Private (Staff/Owner/Admin)
const checkOutVehicle = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);
    if (!booking) {
      throw new Error('Booking not found');
    }
    if (!booking.checkInTime) {
      throw new Error('Vehicle has not checked in yet.');
    }
    if (booking.checkOutTime) {
      throw new Error('Vehicle already checked out.');
    }
    if (booking.status === 'cancelled') {
      throw new Error('Cannot check out a cancelled booking.');
    }

    // Authorization check
    const parkingSpot = await ParkingSpot.findById(
      booking.parkingSpotId
    ).session(session);
    const parkingLot = await ParkingLot.findById(
      parkingSpot.parkingLotId
    ).session(session);

    const isAuthorized =
      req.user.role === 'admin' ||
      (req.user.role === 'parking_owner' &&
        parkingLot &&
        parkingLot.ownerId.toString() === req.user._id.toString()) ||
      (req.user.role === 'staff' &&
        req.user.parkingLotAccess.includes(parkingLot._id.toString()));

    if (!isAuthorized) {
      throw new Error('Not authorized to check out this vehicle.');
    }

    booking.checkOutTime = new Date();
    booking.status = 'completed';

    // Calculate actual duration and overtime fee
    const actualDurationMs =
      booking.checkOutTime.getTime() - booking.checkInTime.getTime();
    const bookedDurationMs =
      booking.endTime.getTime() - booking.startTime.getTime();
    const hourlyRate = parkingLot.hourlyRate; // Assuming hourlyRate is available on ParkingLot

    let totalAmount = 0;
    let overtimeFee = 0;

    if (actualDurationMs > 0) {
      const actualDurationHours = Math.ceil(
        actualDurationMs / (1000 * 60 * 60)
      );
      totalAmount = actualDurationHours * hourlyRate;
    }

    if (actualDurationMs > bookedDurationMs) {
      const overtimeMs = actualDurationMs - bookedDurationMs;
      const overtimeHours = Math.ceil(overtimeMs / (1000 * 60 * 60));
      overtimeFee = overtimeHours * hourlyRate; // Assuming same hourly rate for overtime
      totalAmount = booking.amount + overtimeFee; // Add overtime to initial booking amount
    } else {
      totalAmount = booking.amount; // Use initial amount if no overtime
    }

    booking.overtimeFee = overtimeFee;
    // Note: The `amount` field in Booking model needs to be added if it's not there,
    // or you'll update the Payment model's amount. Assuming Payment will hold final amount.

    await booking.save({ session });

    // Update ParkingSpot status back to 'available' and increment availableSpots via queue
    await ParkingSpot.findByIdAndUpdate(
      booking.parkingSpotId,
      { status: 'available' },
      { new: true, session }
    );
    queueService.addJob('incrementAvailableSpots', {
      parkingLotId: parkingSpot.parkingLotId,
      parkingSpotId: booking.parkingSpotId,
    });

    // Update Payment record
    // const payment = await Payment.findById(booking.paymentId).session(session);
    // if (payment) {
    //   payment.amount = totalAmount; // Update final amount
    //   payment.paymentStatus = 'pending_payment_on_exit'; // Or 'pending' if it was already paid
    //   await payment.save({ session });
    //   // TODO: Trigger payment collection process here if payment_on_exit
    // }

    // Send completion notification
    const notification = new PersonalNotification({
      userId: booking.userId,
      title: 'Booking Completed',
      message: `Your parking session at ${parkingLot.name} for spot ${parkingSpot.spotNumber} has ended. Total due: ${totalAmount} VND.`,
      type: 'booking_completion',
      relatedId: booking._id,
    });
    await notification.save({ session });

    await session.commitTransaction();
    res
      .status(200)
      .json({ message: 'Vehicle checked out successfully', booking });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get all bookings (Admin/Owner/Staff - with filtering)
// @route   GET /api/bookings
// @access  Private (Admin/Owner/Staff)
const getAllBookings = async (req, res, next) => {
  try {
    const {
      userId,
      parkingLotId,
      status,
      // paymentStatus,
      startDate,
      endDate,
    } = req.query;
    let query = { isDeleted: false };

    console.log('status', status);

    // Apply filters based on role
    if (req.user.role === 'user') {
      query.userId = req.user._id;
    } else if (req.user.role === 'parking_owner') {
      // Find parking lots owned by this user
      const ownedParkingLots = await ParkingLot.find({
        ownerId: req.user._id,
      }).select('_id');
      const ownedLotIds = ownedParkingLots.map((lot) => lot._id);
      // Find parking spots within those lots
      const ownedParkingSpots = await ParkingSpot.find({
        parkingLotId: { $in: ownedLotIds },
      }).select('_id');
      const ownedParkingSpotIds = ownedParkingSpots.map((spot) => spot._id);
      query.parkingSpotId = { $in: ownedParkingSpotIds };
    } else if (req.user.role === 'staff') {
      // Assuming staff has access to specific parking lots via req.user.parkingLotAccess
      const accessibleParkingLots = await ParkingLot.find({
        _id: { $in: req.user.parkingLotAccess || [] },
      }).select('_id');
      const accessibleLotIds = accessibleParkingLots.map((lot) => lot._id);
      const accessibleParkingSpots = await ParkingSpot.find({
        parkingLotId: { $in: accessibleLotIds },
      }).select('_id');
      const accessibleParkingSpotIds = accessibleParkingSpots.map(
        (spot) => spot._id
      );
      query.parkingSpotId = { $in: accessibleParkingSpotIds };
    }

    if (
      userId &&
      (req.user.role === 'admin' || req.user.role === 'parking_owner')
    ) {
      query.userId = userId;
    }
    if (
      parkingLotId &&
      (req.user.role === 'admin' ||
        req.user.role === 'parking_owner' ||
        req.user.role === 'staff')
    ) {
      const spotsInLot = await ParkingSpot.find({
        parkingLotId: parkingLotId,
      }).select('_id');
      const spotIdsInLot = spotsInLot.map((spot) => spot._id);
      query.parkingSpotId = { $in: spotIdsInLot };
    }
    if (status) query.status = status;
    // paymentStatus field is in Payment model, not Booking directly.
    // If you need to filter by paymentStatus, you'd need to aggregate or join.
    // For simplicity, let's assume filtering by booking status is enough for now.

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate({
        path: 'parkingSpotId',
        populate: {
          path: 'parkingLotId',
          select: 'name address hourlyRate',
        },
      })
      .populate('vehicleId')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  checkInVehicle,
  checkOutVehicle,
  getAllBookings,
};
