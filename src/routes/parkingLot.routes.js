const express = require('express');
const {
  createParkingLot,
  getAllParkingLots,
  getParkingLotById,
  updateParkingLot,
  softDeleteParkingLot,
  getMyParkingLots,
} = require('../controllers/parkingLot.controller');
const { protect, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(protect, authorizeRoles('admin', 'parking_owner'), createParkingLot)
  .get(getAllParkingLots); // Public route for listing all parking lots

router.get('/my', protect, authorizeRoles('parking_owner'), getMyParkingLots); // Get parking lots owned by current user

router
  .route('/:id')
  .get(getParkingLotById) // Public route for single parking lot details
  .patch(protect, authorizeRoles('admin', 'parking_owner'), updateParkingLot)
  .delete(
    protect,
    authorizeRoles('admin', 'parking_owner'),
    softDeleteParkingLot
  );

module.exports = router;
