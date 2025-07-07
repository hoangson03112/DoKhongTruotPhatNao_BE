const express = require("express");
const {
  createParkingLot,
  getAllParkingLots,
  getParkingLotById,
  updateParkingLot,
  softDeleteParkingLot,
  getMyParkingLots,
} = require("../controllers/parkingLot.controller");
const { protect, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

router
  .route("/")
  .post(protect, authorizeRoles("admin", "parking_owner"), createParkingLot)
  .get(getAllParkingLots); // Public route for listing all parking lots

router.get(
  "/reservations",
  protect,
  authorizeRoles("parking_owner", "admin"),
  getMyParkingLots
); // Get parking lots owned by current user

router.get(
  "/reservations/:id",
  protect,
  authorizeRoles("parking_owner", "admin"),
  getParkingLotById
); // Get parking lots owned by current user

router
  .route("/:id")
  .get(getParkingLotById)
  .put(protect, authorizeRoles("admin", "parking_owner"), updateParkingLot)
  .delete(
    protect,
    authorizeRoles("admin", "parking_owner"),
    softDeleteParkingLot
  );

module.exports = router;
