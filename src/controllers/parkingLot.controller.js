const ParkingLot = require('../models/ParkingLot');
const ParkingSpot = require('../models/ParkingSpot');
const User = require('../models/User');

// Helper to calculate available spots (can be optimized with dedicated cache/queue)
const calculateAvailableSpots = async (parkingLotId) => {
  const totalSpots = await ParkingSpot.countDocuments({
    parkingLotId,
    isDeleted: false,
  });
  const occupiedOrReservedSpots = await ParkingSpot.countDocuments({
    parkingLotId,
    status: { $in: ['occupied', 'reserved'] },
    isDeleted: false,
  });
  return totalSpots - occupiedOrReservedSpots;
};

// @desc    Create a new parking lot
// @route   POST /api/parkinglots
// @access  Private (Admin/Parking_Owner)
const createParkingLot = async (req, res, next) => {
  try {
    const {
      name,
      description,
      address,
      location,
      hourlyRate,
      imageUrls,
      contactPhone,
      contactEmail,
      openingHours,
    } = req.body;

    const newParkingLot = new ParkingLot({
      name,
      description,
      address,
      location,
      hourlyRate,
      imageUrls,
      contactPhone,
      contactEmail,
      ownerId: req.user._id, // Assign owner as the authenticated user
      openingHours: openingHours || [],
      totalSpots: 0, // Initialize to 0, spots will be added later
      availableSpots: 0,
    });

    const createdLot = await newParkingLot.save();
    res.status(201).json(createdLot);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all parking lots
// @route   GET /api/parkinglots
// @access  Public
const getAllParkingLots = async (req, res, next) => {
  try {
    // You might add filtering/pagination here
    const parkingLots = await ParkingLot.find({ isDeleted: false }).populate(
      'ownerId',
      'username email'
    );
    res.status(200).json(parkingLots);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single parking lot by ID
// @route   GET /api/parkinglots/:id
// @access  Public
const getParkingLotById = async (req, res, next) => {
  try {
    const parkingLot = await ParkingLot.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate('ownerId', 'username email');
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking Lot not found' });
    }
    // Update available spots on view (if not using queue/cache)
    // parkingLot.availableSpots = await calculateAvailableSpots(parkingLot._id);
    // await parkingLot.save(); // Save the updated availableSpots if you want it persistent
    res.status(200).json(parkingLot);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a parking lot
// @route   PATCH /api/parkinglots/:id
// @access  Private (Admin/Parking_Owner)
const updateParkingLot = async (req, res, next) => {
  try {
    const parkingLot = await ParkingLot.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking Lot not found' });
    }
    // Authorization check: Only owner or admin can update
    if (
      parkingLot.ownerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this parking lot' });
    }

    const {
      name,
      description,
      address,
      location,
      hourlyRate,
      imageUrls,
      contactPhone,
      contactEmail,
      openingHours,
    } = req.body;

    parkingLot.name = name || parkingLot.name;
    parkingLot.description = description || parkingLot.description;
    parkingLot.address = address || parkingLot.address;
    if (location) parkingLot.location = location; // Update location if provided
    parkingLot.hourlyRate = hourlyRate || parkingLot.hourlyRate;
    parkingLot.imageUrls = imageUrls || parkingLot.imageUrls;
    parkingLot.contactPhone = contactPhone || parkingLot.contactPhone;
    parkingLot.contactEmail = contactEmail || parkingLot.contactEmail;
    parkingLot.openingHours = openingHours || parkingLot.openingHours;

    const updatedLot = await parkingLot.save();
    res.status(200).json(updatedLot);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a parking lot
// @route   DELETE /api/parkinglots/:id
// @access  Private (Admin/Parking_Owner)
const softDeleteParkingLot = async (req, res, next) => {
  try {
    const parkingLot = await ParkingLot.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!parkingLot) {
      return res.status(404).json({ message: 'Parking Lot not found' });
    }
    // Authorization check: Only owner or admin can delete
    if (
      parkingLot.ownerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this parking lot' });
    }

    parkingLot.isDeleted = true;
    parkingLot.deletedAt = new Date();
    await parkingLot.save();

    // Also soft delete all associated parking spots
    await ParkingSpot.updateMany(
      { parkingLotId: parkingLot._id },
      {
        $set: { isDeleted: true, deletedAt: new Date(), status: 'maintenance' },
      } // Mark as maintenance
    );

    res.status(200).json({
      message: 'Parking Lot and associated spots soft deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get parking lots owned by the authenticated owner
// @route   GET /api/parkinglots/my
// @access  Private (Parking_Owner)
const getMyParkingLots = async (req, res, next) => {
  try {
    const parkingLots = await ParkingLot.find({
      ownerId: req.user._id,
      isDeleted: false,
    });
    res.status(200).json(parkingLots);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createParkingLot,
  getAllParkingLots,
  getParkingLotById,
  updateParkingLot,
  softDeleteParkingLot,
  getMyParkingLots,
};
