const ParkingSpot = require('../models/ParkingSpot');
const ParkingLot = require('../models/ParkingLot');
const { default: mongoose } = require('mongoose');

// @desc    Create new parking spot(s) for a parking lot
// @route   POST /api/parkingspots
// @access  Private (Admin/Parking_Owner/Staff)
const createParkingSpot = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { parkingLotId, spotNumber, type, floor, wing } = req.body;

    const parkingLot = await ParkingLot.findById(parkingLotId).session(session);
    if (!parkingLot) {
      throw new Error('Parking Lot not found');
    }

    // Authorization check: only owner/admin/staff of that parking lot
    if (
      parkingLot.ownerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      !(
        req.user.role === 'staff' &&
        req.user.parkingLotAccess.includes(parkingLotId.toString())
      )
    ) {
      // Assuming staff has parkingLotAccess array
      throw new Error('Not authorized to add spots to this parking lot');
    }

    const existingSpot = await ParkingSpot.findOne({
      parkingLotId,
      spotNumber,
      isDeleted: false,
    }).session(session);
    if (existingSpot) {
      throw new Error('Spot number already exists in this parking lot.');
    }

    const newSpot = new ParkingSpot({
      parkingLotId,
      spotNumber,
      type,
      floor,
      wing,
      status: 'available', // Newly created spots are available by default
    });

    const createdSpot = await newSpot.save({ session });

    // Update totalSpots and availableSpots for the parking lot atomically
    const updatedLot = await ParkingLot.findByIdAndUpdate(
      parkingLotId,
      { $inc: { totalSpots: 1, availableSpots: 1 } },
      { new: true, session }
    );

    if (!updatedLot) {
      throw new Error('Failed to update parking lot spot counts.');
    }

    await session.commitTransaction();
    res.status(201).json(createdSpot);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get all parking spots for a specific parking lot
// @route   GET /api/parkingspots/by-lot/:parkingLotId
// @access  Public (or Private for staff to manage)
const getParkingSpotsByLot = async (req, res, next) => {
  try {
    const parkingSpots = await ParkingSpot.find({
      parkingLotId: req.params.parkingLotId,
      isDeleted: false,
    });
    if (!parkingSpots) {
      return res
        .status(404)
        .json({ message: 'Parking spots not found for this lot' });
    }
    res.status(200).json(parkingSpots);
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single parking spot by ID
// @route   GET /api/parkingspots/:id
// @access  Public
const getParkingSpotById = async (req, res, next) => {
  try {
    const parkingSpot = await ParkingSpot.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!parkingSpot) {
      return res.status(404).json({ message: 'Parking Spot not found' });
    }
    res.status(200).json(parkingSpot);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a parking spot (e.g., change status, type)
// @route   PATCH /api/parkingspots/:id
// @access  Private (Admin/Parking_Owner/Staff)
const updateParkingSpot = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status, type, floor, wing, spotNumber } = req.body;
    const parkingSpot = await ParkingSpot.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);

    if (!parkingSpot) {
      throw new Error('Parking Spot not found');
    }

    const parkingLot = await ParkingLot.findById(
      parkingSpot.parkingLotId
    ).session(session);
    if (!parkingLot) {
      throw new Error('Associated Parking Lot not found');
    }

    // Authorization check
    if (
      parkingLot.ownerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      !(
        req.user.role === 'staff' &&
        req.user.parkingLotAccess.includes(parkingLot._id.toString())
      )
    ) {
      throw new Error('Not authorized to update this parking spot');
    }

    const oldStatus = parkingSpot.status;
    let availableSpotsChange = 0;

    // Logic for availableSpots update based on status change
    if (status && status !== oldStatus) {
      if (
        (oldStatus === 'occupied' || oldStatus === 'reserved') &&
        status === 'available'
      ) {
        availableSpotsChange = 1;
      } else if (
        oldStatus === 'available' &&
        (status === 'occupied' || status === 'reserved')
      ) {
        availableSpotsChange = -1;
      } else if (oldStatus === 'maintenance' && status === 'available') {
        availableSpotsChange = 1;
      } else if (oldStatus === 'available' && status === 'maintenance') {
        availableSpotsChange = -1;
      }
    }

    parkingSpot.status = status || parkingSpot.status;
    parkingSpot.type = type || parkingSpot.type;
    parkingSpot.floor = floor !== undefined ? floor : parkingSpot.floor;
    parkingSpot.wing = wing || parkingSpot.wing;
    parkingSpot.spotNumber = spotNumber || parkingSpot.spotNumber; // Allow changing spot number (with care)

    const updatedSpot = await parkingSpot.save({ session });

    if (availableSpotsChange !== 0) {
      const updatedLot = await ParkingLot.findByIdAndUpdate(
        parkingLot._id,
        { $inc: { availableSpots: availableSpotsChange } },
        { new: true, session }
      );
      if (!updatedLot || updatedLot.availableSpots < 0) {
        // Should not go below 0
        throw new Error(
          'Failed to update parking lot available spots or invalid count.'
        );
      }
    }

    await session.commitTransaction();
    res.status(200).json(updatedSpot);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Soft delete a parking spot
// @route   DELETE /api/parkingspots/:id
// @access  Private (Admin/Parking_Owner)
const softDeleteParkingSpot = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const parkingSpot = await ParkingSpot.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);
    if (!parkingSpot) {
      throw new Error('Parking Spot not found');
    }

    const parkingLot = await ParkingLot.findById(
      parkingSpot.parkingLotId
    ).session(session);
    if (!parkingLot) {
      throw new Error('Associated Parking Lot not found');
    }

    // Authorization check
    if (
      parkingLot.ownerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      throw new Error('Not authorized to delete this parking spot');
    }

    const oldStatus = parkingSpot.status;
    let availableSpotsChange = 0;

    if (oldStatus === 'available' || oldStatus === 'reserved') {
      // If it was counted as available or reserved, reduce total and available/reserved counts
      availableSpotsChange = -1;
    }

    parkingSpot.isDeleted = true;
    parkingSpot.deletedAt = new Date();
    parkingSpot.status = 'maintenance'; // Mark as maintenance even if soft deleted
    await parkingSpot.save({ session });

    // Update totalSpots and availableSpots for the parking lot atomically
    const updateQuery = { $inc: { totalSpots: -1 } };
    if (availableSpotsChange < 0) {
      // Only decrement availableSpots if it was counted
      updateQuery.$inc.availableSpots = availableSpotsChange;
    }

    const updatedLot = await ParkingLot.findByIdAndUpdate(
      parkingSpot.parkingLotId,
      updateQuery,
      { new: true, session }
    );
    if (
      !updatedLot ||
      updatedLot.totalSpots < 0 ||
      updatedLot.availableSpots < 0
    ) {
      throw new Error(
        'Failed to update parking lot spot counts or invalid count.'
      );
    }

    await session.commitTransaction();
    res.status(200).json({ message: 'Parking Spot soft deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Update status of a parking spot (primarily for staff/admin/owner)
// @route   PATCH /api/parkingspots/:id/status
// @access  Private (Admin/Parking_Owner/Staff)
const updateParkingSpotStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status } = req.body; // New status
    if (
      !['available', 'occupied', 'reserved', 'maintenance'].includes(status)
    ) {
      throw new Error('Invalid status provided.');
    }

    const parkingSpot = await ParkingSpot.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).session(session);
    if (!parkingSpot) {
      throw new Error('Parking Spot not found');
    }

    const parkingLot = await ParkingLot.findById(
      parkingSpot.parkingLotId
    ).session(session);
    if (!parkingLot) {
      throw new Error('Associated Parking Lot not found');
    }

    // Authorization check
    if (
      parkingLot.ownerId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      !(
        req.user.role === 'staff' &&
        req.user.parkingLotAccess.includes(parkingLot._id.toString())
      )
    ) {
      throw new Error('Not authorized to update this parking spot status');
    }

    const oldStatus = parkingSpot.status;
    let availableSpotsChange = 0;

    if (status !== oldStatus) {
      if (
        (oldStatus === 'occupied' || oldStatus === 'reserved') &&
        status === 'available'
      ) {
        availableSpotsChange = 1;
      } else if (
        oldStatus === 'available' &&
        (status === 'occupied' || status === 'reserved')
      ) {
        availableSpotsChange = -1;
      } else if (oldStatus === 'maintenance' && status === 'available') {
        availableSpotsChange = 1;
      } else if (oldStatus === 'available' && status === 'maintenance') {
        availableSpotsChange = -1;
      }
    }

    parkingSpot.status = status;
    const updatedSpot = await parkingSpot.save({ session });

    if (availableSpotsChange !== 0) {
      const updatedLot = await ParkingLot.findByIdAndUpdate(
        parkingLot._id,
        { $inc: { availableSpots: availableSpotsChange } },
        { new: true, session }
      );
      if (!updatedLot || updatedLot.availableSpots < 0) {
        throw new Error(
          'Failed to update parking lot available spots or invalid count.'
        );
      }
    }

    await session.commitTransaction();
    res.status(200).json(updatedSpot);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

module.exports = {
  createParkingSpot,
  getParkingSpotsByLot,
  getParkingSpotById,
  updateParkingSpot,
  softDeleteParkingSpot,
  updateParkingSpotStatus,
};
