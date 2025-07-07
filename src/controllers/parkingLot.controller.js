const ParkingLot = require('../models/ParkingLot');
const User = require('../models/User');
const Pricing = require('../models/Pricing');
const mongoose = require('mongoose');

// @desc    Danh sách bãi đỗ mình quản lý (Cho Parking Owner / Staff)
// @route   GET /api/owner/parking-lots
// @access  Private (Parking Owner, Staff)
const getOwnerParkingLots = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const userRole = req.user.role;

    let query = {};
    if (userRole === 'parking_owner') {
      query.owner = ownerId;
    } else if (userRole === 'staff') {
      return res.status(403).json({
        success: false,
        message:
          'Staff role not configured for specific parking lot access. Cannot view owner parking lots.',
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access owner parking lots.',
      });
    }

    const parkingLots = await ParkingLot.find(query)
      .populate('owner', 'username email')
      .populate('pricing');

    res.status(200).json({
      success: true,
      count: parkingLots.length,
      data: parkingLots,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Thêm bãi đỗ mới
// @route   POST /api/owner/parking-lots
// @access  Private (Parking Owner)
const createParkingLot = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Lưu ý: availableSlots không cần gửi trong request body nữa,
    // nó sẽ được tự động tính từ capacity bởi hook của ParkingLot
    const {
      name,
      address,
      coordinates,
      capacity,
      pricing,
      images,
      parkingType,
    } = req.body;
    const ownerId = req.user._id;

    if (req.user.role !== 'parking_owner') {
      throw new Error('Only parking owners can create new parking lots.');
    }

    if (
      !name ||
      !address ||
      !coordinates ||
      !capacity ||
      !pricing ||
      !Array.isArray(pricing) ||
      pricing.length === 0
    ) {
      throw new Error(
        'Missing required parking lot information: name, address, coordinates, capacity, and pricing are required.'
      );
    }

    // Xử lý phần pricing (tạo các Pricing documents mới)
    let pricingIds = [];
    for (const p of pricing) {
      // Với Pricing model mới của bạn, chỉ chấp nhận type 'hourly'
      if (p.type !== 'hourly' || typeof p.price !== 'number' || p.price < 0) {
        throw new Error(
          'Invalid pricing item. Only "hourly" type with a valid price is accepted.'
        );
      }

      const newPricingDoc = await Pricing.create(
        [
          {
            type: p.type,
            price: p.price,
          },
        ],
        { session }
      );
      pricingIds.push(newPricingDoc[0]._id);
    }

    // Tạo bãi đỗ xe mới
    const newParkingLot = new ParkingLot({
      name,
      address,
      coordinates,
      capacity,
      // availableSlots sẽ được tự động set bằng capacity bởi hook pre('save') của ParkingLot
      pricing: pricingIds,
      owner: ownerId,
      images: images || [],
      parkingType: parkingType || 'official',
      verificationStatus: 'pending',
    });

    await newParkingLot.save({ session });

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      data: newParkingLot,
      message: 'Parking lot created successfully and awaiting verification.',
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating parking lot:', error.message);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = {
  getOwnerParkingLots,
  createParkingLot,
};
