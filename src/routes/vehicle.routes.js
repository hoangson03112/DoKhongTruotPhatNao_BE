const express = require('express');
const {
  addVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  softDeleteVehicle,
  getAllVehicles,
} = require('../controllers/vehicle.controller');
const { protect, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(protect, addVehicle)
  .get(protect, authorizeRoles('admin'), getAllVehicles);
router.get('/my', protect, getMyVehicles);
router
  .route('/:id')
  .get(protect, getVehicleById)
  .patch(protect, updateVehicle)
  .delete(protect, softDeleteVehicle);

module.exports = router;
