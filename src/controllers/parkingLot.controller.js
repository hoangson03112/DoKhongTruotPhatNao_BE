const ParkingLot = require("../models/ParkingLot");
const User = require("../models/User");

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
      owner: req.user._id, // Thống nhất dùng 'owner'
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
    const parkingLots = await ParkingLot.find({}).populate("owner");
    res.status(200).json(parkingLots);
  } catch (error) {
    next(error);
  }
};

const getParkingLotById = async (req, res, next) => {
  try {
    const parkingLot = await ParkingLot.findById(req.params.id);
    if (!parkingLot) {
      return res.status(404).json({ message: "Parking Lot not found" });
    }

    res.status(200).json(parkingLot);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a parking lot
// @route   PUT /api/owner/parking-lots/:id
// @access  Private (Admin/Parking_Owner)
const updateParkingLot = async (req, res, next) => {
  try {
    const parkingLot = await ParkingLot.findById(req.params.id);

    if (!parkingLot) {
      return res.status(404).json({ message: "Parking Lot not found" });
    }
    // Authorization check: Only owner or admin can update
    if (
      parkingLot.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this parking lot" });
    }
    if (parkingLot.status === "active") {
      parkingLot.status = "inactive";
    } else {
      parkingLot.status = "active";
    }

    await parkingLot.save();
    res.status(200).json({
      message: "Parking lot status updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

const softDeleteParkingLot = async (req, res, next) => {
  try {
    const parkingLot = await ParkingLot.findOne({
      _id: req.params.id,
      isDeleted: false,
    });
    if (!parkingLot) {
      return res.status(404).json({ message: "Parking Lot not found" });
    }
    // Authorization check: Only owner or admin can delete
    if (
      parkingLot.owner.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this parking lot" });
    }

    parkingLot.isDeleted = true;
    parkingLot.deletedAt = new Date();
    await parkingLot.save();

    // // Also soft delete all associated parking spots
    // await ParkingSpot.updateMany(
    //   { parkingLotId: parkingLot._id },
    //   {
    //     $set: { isDeleted: true, deletedAt: new Date(), status: 'maintenance' },
    //   } // Mark as maintenance
    // );

    res.status(200).json({
      message: "Parking Lot and associated spots soft deleted successfully",
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
    console.log("req.user", req.user);
    const parkingLots = await ParkingLot.find({
      owner: req.user._id,
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
