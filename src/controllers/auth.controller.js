const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper để gửi token trong response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken(); // Lấy token từ method của user model

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7 * 24 * 60 * 60 * 1000)
    ), // Cookie hết hạn (ví dụ: 7 ngày)
    httpOnly: true, // Ngăn chặn truy cập từ client-side script
  };

  // Nếu trong môi trường production, chỉ gửi cookie qua HTTPS
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        parkingLotAccess: user.parkingLotAccess, // Trả về quyền truy cập cho staff
      },
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { username, email, password, name, phone, role, parkingLotAccess } =
      req.body;

    // Kiểm tra xem username hoặc email đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
      isDeleted: false,
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Username or Email already exists.' });
    }

    // Chỉ cho phép admin tạo các vai trò khác hoặc gán parkingLotAccess
    let userRole = 'user';
    let userParkingLotAccess = [];

    if (req.user && req.user.role === 'admin') {
      // Chỉ admin mới có thể tạo user với role khác
      if (['admin', 'parking_owner', 'staff'].includes(role)) {
        userRole = role;
      }
      if (role === 'staff' && Array.isArray(parkingLotAccess)) {
        userParkingLotAccess = parkingLotAccess;
      }
    }

    const user = await User.create({
      username,
      email,
      password,
      name,
      phone,
      role: userRole,
      parkingLotAccess: userParkingLotAccess,
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Please enter an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email, isDeleted: false }).select(
      '+password'
    ); // Select password explicitly
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save(); // Save the updated lastLogin

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user được lấy từ middleware protect
    const user = await User.findById(req.user._id).select(
      '-password -refreshToken'
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  // Bạn có thể xóa refreshToken từ DB nếu bạn muốn invalidate token đó
  // Ví dụ: const user = await User.findById(req.user._id); user.refreshToken = undefined; await user.save();
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Hết hạn ngay lập tức
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    data: {},
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
