const User = require("../models/User");
const Booking = require("../models/Booking");
const getAllOwners = async (req, res, next) => {
  try {
    const owners = await User.find({ role: "parking_owner" }).select(
      "-password"
    );
    res.status(200).json(owners);
  } catch (error) {
    next(error);
  }
};
const getUserProfile = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    const user = await User.findById(req.user._id).select(
      "-password -refreshToken"
    );
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PATCH /api/users/profile
// @access  Private (User)
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.avatar = req.body.avatar || user.avatar;

      if (req.body.password) {
        user.password = req.body.password; // Mongoose pre-save hook will hash it
      }

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const softDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
    res.status(200).json({ message: "User soft deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Update any user (Admin only)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    const { status } = req.body;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.verificationStatus = status;
    await user.save();
    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUser,
  softDeleteUser,
  getAllOwners,
};
