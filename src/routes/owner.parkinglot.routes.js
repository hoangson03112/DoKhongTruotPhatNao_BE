const express = require('express');
const {
  getOwnerParkingLots,
  createParkingLot,
} = require('../controllers/parkingLot.controller');
const { protect, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, getOwnerParkingLots)
  .post(protect, createParkingLot);

module.exports = router;
