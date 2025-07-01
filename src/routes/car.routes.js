const express = require('express');
const router = express.Router();
const CarController = require('../controllers/CarController');

router.post('/', CarController.createCar);
router.get('/', CarController.getCars);
router.get('/:id', CarController.getCarById);

module.exports = router; 