const express = require("express");
const {
  createBooking,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
  getMyBookings,
  checkInVehicle,
  checkOutVehicle,
} = require("../controllers/booking.controller");
const { protect, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

// User tạo booking
router.route("/").post(protect, createBooking);
// User xem booking của mình
router.get("/", protect, getMyBookings);
// (Có thể thêm route cho admin/owner xem tất cả booking nếu cần)
// router.get("/", protect, authorizeRoles('admin', 'parking_owner', 'staff'), getAllBookings);

// Xem chi tiết booking
router.route("/:id").get(protect, getBookingDetails);

// Huỷ booking
router.patch("/:id/cancel", protect, cancelBooking);

// Check-in xe
router.patch(
  "/:id/checkin",
  protect,
  authorizeRoles("admin", "parking_owner", "staff"),
  checkInVehicle
);

// Check-out xe
router.patch(
  "/:id/checkout",
  protect,
  authorizeRoles("admin", "parking_owner", "staff"),
  checkOutVehicle
);

module.exports = router;
