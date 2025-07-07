const express = require("express");
const { protect, authorizeRoles } = require("../middlewares/auth");
const {
  getAllUsers,
  updateUser,
  softDeleteUser,
  getAllOwners,
} = require("../controllers/user.controller");
const { register, adminLogin } = require("../controllers/auth.controller");
const {
  getAllParkingLots,
  updateParkingLot,
  softDeleteParkingLot,
} = require("../controllers/parkingLot.controller");

const router = express.Router();



// All other routes require admin authentication
router.use(protect);
router.use(authorizeRoles("admin"));

// User management routes
router.get("/users", getAllUsers);
router.post("/users", register); // Admin can create users with any role
router.put("/users/:id", updateUser);
router.delete("/users/:id", softDeleteUser);

// Parking owner management routes
router.get("/owners", getAllOwners); // Same function, can filter by role in query
router.put("/owners/:id", updateUser); // Same function as updating users
router.delete("/owners/:id", softDeleteUser); // Same function as deleting users

// Parking lot management routes
router.get("/parking-lots", getAllParkingLots);
router.put("/parking-lots/:id", updateParkingLot);
router.delete("/parking-lots/:id", softDeleteParkingLot);

module.exports = router;
