const express = require('express');
const {
  createParkingSpot,
  getParkingSpotsByLot,
  getParkingSpotById,
  updateParkingSpot,
  softDeleteParkingSpot,
  updateParkingSpotStatus,
} = require('../controllers/parkingSpot.controller');
const { protect, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(
    protect,
    authorizeRoles('admin', 'parking_owner', 'staff'),
    createParkingSpot
  );
router.get('/by-lot/:parkingLotId', getParkingSpotsByLot); // Public route for general view

router
  .route('/:id')
  .get(getParkingSpotById) // Public
  .patch(
    protect,
    authorizeRoles('admin', 'parking_owner', 'staff'),
    updateParkingSpot
  )
  .delete(
    protect,
    authorizeRoles('admin', 'parking_owner'),
    softDeleteParkingSpot
  );

router.patch(
  '/:id/status',
  protect,
  authorizeRoles('admin', 'parking_owner', 'staff'),
  updateParkingSpotStatus
);

module.exports = router;
