const ParkingLot = require("../models/ParkingLot");
const User = require("../models/User");
const Pricing = require("../models/Pricing");

// @desc    Create a new parking lot
// @route   POST /api/parkinglots
// @access  Private (Admin/Parking_Owner)
const createParkingLot = async (req, res, next) => {
  try {
    const { name, address, coordinates, capacity, pricing, images } = req.body;

    // Validation for required fields
    if (!name || !address || !coordinates || !capacity || !images || !pricing) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, address, coordinates, capacity, images, pricing",
      });
    }

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required for the parking lot",
      });
    }

    // Validate coordinates structure
    if (!coordinates.lat || !coordinates.lng) {
      return res.status(400).json({
        success: false,
        message: "Coordinates must include lat and lng",
      });
    }

    // Validate capacity is positive number
    if (capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be a positive number",
      });
    }

    // Handle pricing - create default pricing if not provided
    let pricingArray = [];
    if (pricing && Array.isArray(pricing) && pricing.length > 0) {
      pricingArray = pricing;
    } else {
      // Create or find default hourly pricing
      let defaultPricing = await Pricing.findOne({ type: "hourly" });
      if (!defaultPricing) {
        defaultPricing = new Pricing({
          type: "hourly",
          price: 5000, // Default price 5000 VND per hour
        });
        defaultPricing = await defaultPricing.save();
      }
      pricingArray.push(defaultPricing._id);
    }

    const newParkingLot = new ParkingLot({
      name,
      address,
      coordinates,
      capacity,
      pricing: pricingArray,
      images,
      owner: req.user._id,
      availableSlots: capacity, // Will be set by pre-save hook too, but explicit is good
    });

    const createdLot = await newParkingLot.save();

    // Populate owner and pricing for response
    await createdLot.populate("owner", "name email username");
    await createdLot.populate("pricing");

    res.status(201).json({
      success: true,
      message: "Parking lot created successfully",
      data: createdLot,
    });
  } catch (error) {
    console.error("Error creating parking lot:", error.message);
    next(error);
  }
};

// @desc    Get all parking lots
// @route   GET /api/parkinglots
// @access  Public
const getAllParkingLots = async (req, res, next) => {
  try {
    // You might add filtering/pagination here
    //Lấy ra các bãi đỗ xe đã được xác minh và còn tồn tại, và đã được đưa vào sử dụng (active)
    const parkingLots = await ParkingLot.find({
      isDeleted: false,
    })
      .populate("pricing")
      .populate("owner");
    res.status(200).json(parkingLots);
  } catch (error) {
    next(error);
  }
};

//For admin, owners
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

//For users
const getParkingLotDetails = async (req, res, next) => {
  try {
    const parkingLot = await ParkingLot.find({
      _id: req.params.id,
      isDeleted: false,
      verificationStatus: "verified",
      status: "active",
    })
      .populate("pricing")
      .populate("owner");
    if (!parkingLot) {
      return res.status(404).json({ message: "Parking Lot not found" });
    }
    res.status(200).json(parkingLot[0]);
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
      //Bonus: Đảm bảo trạng thái verificationStatus đã chuyển thành verified nếu trước đó vẫn là pending
      if (parkingLot.verificationStatus === "pending") {
        parkingLot.verificationStatus = "verified";
      }
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

const updateSlotOfParkingLot = async (req, res, next) => {
  try {
    const { action } = req.body;
    const parkingLot = await ParkingLot.findById(req.params.id)
      .populate("owner")
      .populate("pricing");
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
    const availableSlots = parkingLot.availableSlots;
    const totalSlots = parkingLot.capacity;
    if (availableSlots === totalSlots && action === "increase") {
      return res.status(400).json({
        message: "Cannot increase slots when all slots are available",
      });
    }
    if (availableSlots === 0 && action === "decrease") {
      return res.status(400).json({
        message: "Cannot decrease slots when all slots are occupied",
      });
    }

    if (action === "increase") {
      parkingLot.availableSlots += 1;
    }
    if (action === "decrease") {
      parkingLot.availableSlots -= 1;
    }

    await parkingLot.save();

    res.status(200).json({
      message: "Parking lot slots updated successfully",
      data: parkingLot,
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
      owner: req.user._id,
      isDeleted: false,
    }).populate("pricing");
    res.status(200).json(parkingLots);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createParkingLot,
  getAllParkingLots,
  getParkingLotById,
  getParkingLotDetails,
  updateParkingLot,
  softDeleteParkingLot,
  getMyParkingLots,
  updateSlotOfParkingLot,
};
