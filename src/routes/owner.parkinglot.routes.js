const express = require("express");
const {
  getMyParkingLots,
  createParkingLot,
  updateParkingLot,
  softDeleteParkingLot,
  updateSlotOfParkingLot,
} = require("../controllers/parkingLot.controller");
const { protect, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

router
  .route("/")
  .get(protect, authorizeRoles("parking_owner", "admin"), getMyParkingLots)
  .post(protect, authorizeRoles("parking_owner", "admin"), createParkingLot);

router
  .route("/:id")
  .put(protect, authorizeRoles("parking_owner", "admin"), updateParkingLot)
  .patch(
    protect,
    authorizeRoles("admin", "parking_owner"),
    updateSlotOfParkingLot
  )
  .delete(
    protect,
    authorizeRoles("parking_owner", "admin"),
    softDeleteParkingLot
  );

module.exports = router;
