const Vehicle = require('../models/Vehicle');
const User = require('../models/User'); // For verification

// @desc    Add a new vehicle
// @route   POST /api/vehicles
// @access  Private (User)
const addVehicle = async (req, res, next) => {
  try {
    const { licensePlate, vehicleType, brand, model, color, imageUrl } =
      req.body;

    const existingVehicle = await Vehicle.findOne({
      licensePlate,
      isDeleted: false,
    });
    if (existingVehicle) {
      return res
        .status(400)
        .json({ message: 'Vehicle with this license plate already exists.' });
    }

    const vehicle = new Vehicle({
      userId: req.user._id, // Set user from authenticated user
      licensePlate,
      vehicleType,
      brand,
      model,
      color,
      imageUrl,
    });

    const createdVehicle = await vehicle.save();
    res.status(201).json(createdVehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vehicles for authenticated user
// @route   GET /api/vehicles/my
// @access  Private (User)
const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({
      userId: req.user._id,
      isDeleted: false,
    });
    res.status(200).json(vehicles);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Private (User/Admin)
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    // Only allow owner or admin to view
    if (
      vehicle.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this vehicle' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a vehicle
// @route   PATCH /api/vehicles/:id
// @access  Private (User)
const updateVehicle = async (req, res, next) => {
  try {
    const { licensePlate, vehicleType, brand, model, color, imageUrl } =
      req.body;
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Only allow owner to update
    if (vehicle.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this vehicle' });
    }

    vehicle.licensePlate = licensePlate || vehicle.licensePlate;
    vehicle.vehicleType = vehicleType || vehicle.vehicleType;
    vehicle.brand = brand || vehicle.brand;
    vehicle.model = model || vehicle.model;
    vehicle.color = color || vehicle.color;
    vehicle.imageUrl = imageUrl || vehicle.imageUrl;

    const updatedVehicle = await vehicle.save();
    res.status(200).json(updatedVehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (User)
const softDeleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    // Only allow owner to delete
    if (vehicle.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this vehicle' });
    }

    vehicle.isDeleted = true;
    vehicle.deletedAt = new Date();
    await vehicle.save();
    res.status(200).json({ message: 'Vehicle soft deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vehicles (Admin only)
// @route   GET /api/vehicles
// @access  Private (Admin)
const getAllVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ isDeleted: false });
    res.status(200).json(vehicles);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  softDeleteVehicle,
  getAllVehicles,
};
