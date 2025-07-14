const Booking = require("../models/Booking");
const ParkingLot = require("../models/ParkingLot");
// const Payment = require('../models/Payment');
const PersonalNotification = require("../models/PersonalNotifications");
const { default: mongoose } = require("mongoose");
const queueService = require("../utils/queueService"); // Import the queue service

// @desc    Create a new booking - Tạo booking mới
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = async (req, res, next) => {
  try {
    // Các trường cần thiết cho Booking (không còn pricingType, vehicleType)
    const { parkingLotId, startTime, timeCheckOut, licensePlate } = req.body;
    const userId = req.user._id;

    // Các validation cơ bản trước khi tạo Booking
    if (!parkingLotId || !startTime || !timeCheckOut || !licensePlate) {
      throw new Error(
        "Missing required booking information: parkingLotId, startTime, timeCheckOut, licensePlate."
      );
    }

    const parsedStartTime = new Date(startTime);
    const parsedtimeCheckOut = new Date(timeCheckOut);

    // Tìm bãi đỗ xe để kiểm tra trạng thái xác minh
    const parkingLot = await ParkingLot.findById(parkingLotId);
    if (!parkingLot) {
      return res
        .status(404)
        .json({ success: false, message: "Parking lot not found." });
    }
    if (parkingLot.verificationStatus !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Cannot book unverified parking lot.",
      });
    }

    // Tạo Booking. Logic kiểm tra availableSlots, tính giá, và các validation thời gian
    // SẼ ĐƯỢC XỬ LÝ HOÀN TOÀN TRONG PRE-SAVE HOOK CỦA BOOKING MODEL.
    const newBooking = new Booking({
      user: userId,
      parkingLot: parkingLotId,
      startTime: parsedStartTime,
      timeCheckOut: parsedtimeCheckOut,
      licensePlate,
      status: "pending",
      // cancellationPolicy: có thể thêm từ req.body nếu có
    });

    await newBooking.save(); // Hook pre('save') sẽ chạy ở đây

    res.status(201).json({
      success: true,
      data: newBooking, // newBooking giờ đây đã có totalPrice được hook gán
      message:
        "Booking created successfully. Please note your booking code for check-in.",
    });
  } catch (error) {
    console.error("Error creating booking:", error.message);
    // Kiểm tra lỗi từ hook (ví dụ: "No available slots", "Pricing not found", "startTime cannot be more than 24 hours")
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings for the authenticated user - Lấy lịch sử booking của user
// @route   GET /api/bookings
// @access  Private (User)
const getUserBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({
      user: userId,
      status: { $ne: "cancelled" },
    })
      .populate("parkingLot", "name address coordinates images")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single booking by ID - Lấy chi tiết booking
// @route   GET /api/bookings/:id
// @access  Private (User/Admin/Staff)
const getBookingDetails = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId)
      .populate("user", "username email name phone")
      .populate("parkingLot", "name address coordinates images owner");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    const userRole = req.user.role;
    if (
      userRole === "user" &&
      booking.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking.",
      });
    }
    if (
      userRole === "parking_owner" &&
      booking.parkingLot.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking.",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking - Huỷ booking
// @route   PATCH /api/bookings/:id
// @access  Private (User/Admin/Staff/Owner)

const cancelBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    const userRole = req.user.role;
    // Kiểm tra quyền hủy
    if (userRole === "user") {
      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to cancel this booking.",
        });
      }
      if (booking.status !== "pending" && booking.status !== "confirmed") {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel a booking that is not pending or confirmed.",
        });
      }
      if (
        booking.cancellationPolicy &&
        booking.cancellationPolicy.maxCancelTime &&
        new Date() > booking.cancellationPolicy.maxCancelTime
      ) {
        return res.status(400).json({
          success: false,
          message: "Cancellation time has passed according to policy.",
        });
      }
    } else if (userRole === "parking_owner" || userRole === "staff") {
      const parkingLot = await ParkingLot.findById(booking.parkingLot);
      if (!parkingLot) {
        return res.status(404).json({
          success: false,
          message: "Associated parking lot not found.",
        });
      }

      if (
        userRole === "parking_owner" &&
        parkingLot.owner.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to cancel bookings for this parking lot.",
        });
      }
      if (userRole === "staff") {
        return res.status(403).json({
          success: false,
          message:
            "Staff role not configured for specific parking lot access. Not authorized to cancel.",
        });
      }
      if (booking.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel a completed booking.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role to cancel booking.",
      });
    }

    // Cập nhật trạng thái booking thành 'cancelled'
    booking.status = "cancelled";
    await booking.save(); // Hook post('save') sẽ chạy ở đây để tăng availableSlots

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      data: booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings for the authenticated user (alias getMyBookings)
// @route   GET /api/bookings/my
// @access  Private (User)
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const bookings = await Booking.find({
      user: userId,
      // status: { $ne: 'cancelled' }, //lấy cả các booking đã bị huỷ
    })
      .populate("parkingLot", "name address coordinates images")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in vehicle - Update booking status to 'active'
// @route   PATCH /api/bookings/:id/checkin
// @access  Private (Admin/Parking_Owner/Staff)
const checkInVehicle = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed bookings can be checked in.",
      });
    }

    // Update booking status to active
    booking.status = "active";
    booking.actualStartTime = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Vehicle checked in successfully.",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-out vehicle - Update booking status to 'completed'
// @route   PATCH /api/bookings/:id/checkout
// @access  Private (Admin/Parking_Owner/Staff)
const checkOutVehicle = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    if (booking.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active bookings can be checked out.",
      });
    }

    // Update booking status to completed
    booking.status = "completed";
    booking.actualEndTime = new Date();
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Vehicle checked out successfully.",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

const getOwnerReservations = async (req, res, next) => {
  try {
    const reservations = await Booking.find({
      parkingLot: req.params.id,
      status: { $in: ["pending", "confirmed"] },
    })
      .populate("user")
      .populate({
        path: "parkingLot",
        populate: {
          path: "pricing",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a reservation (for parking lot owners)
// @route   PUT /api/owner/reservations/:id
// @access  Private (Parking_Owner/Admin)
const updateReservation = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId).populate("parkingLot");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found." });
    }

    // Check if the current user owns the parking lot for this booking
    if (
      booking.parkingLot.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this reservation.",
      });
    }

    const { status } = req.body;

    // Update allowed fields
    if (status) booking.status = status;

    const updatedBooking = await booking.save();

    res.status(200).json({
      success: true,
      message: "Reservation updated successfully.",
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
  getMyBookings,
  checkInVehicle,
  checkOutVehicle,
  getOwnerReservations,
  updateReservation,
};
