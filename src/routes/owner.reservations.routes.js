const express = require("express");
const {
  getOwnerReservations,
  updateReservation,
} = require("../controllers/booking.controller");
const { protect, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

// All routes require parking_owner or admin authentication
router.use(protect);
router.use(authorizeRoles("parking_owner", "admin"));

// GET /api/owner/reservations - Get all reservations for owner's parking lots
router.get("/:id/reservations", getOwnerReservations);

// PUT /api/owner/reservations/:id - Update a specific reservation
router.put("/reservations/:id", updateReservation);

module.exports = router;
