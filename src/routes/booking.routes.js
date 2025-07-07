const express = require("express");
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  checkInVehicle,
  checkOutVehicle,
  getAllBookings,
} = require("../controllers/booking.controller");
const { protect, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

router.route("/").post(protect, createBooking); // User creates booking
router.get("/", protect, getMyBookings); // User views their bookings
// router.get(
//   '/',
//   protect,
//   authorizeRoles('admin', 'parking_owner', 'staff'),
//   getAllBookings
// ); // Admin/Owner/Staff views all/filtered bookings

router.route("/:id").get(protect, getBookingById); // User/Admin/Owner/Staff get specific booking

router.patch("/:id/cancel", protect, cancelBooking); // User/Admin/Owner/Staff cancel booking
router.patch(
  "/:id/checkin",
  protect,
  authorizeRoles("admin", "parking_owner", "staff"),
  checkInVehicle
); // Staff/Owner/Admin check-in
router.patch(
  "/:id/checkout",
  protect,
  authorizeRoles("admin", "parking_owner", "staff"),
  checkOutVehicle
); // Staff/Owner/Admin check-out

module.exports = router;
