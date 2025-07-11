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
        ownerVerificationImages: user.ownerVerificationImages || undefined,
        verificationStatus: user.verificationStatus, // TRẢ VỀ TRẠNG THÁI XÁC MINH
        // parkingLotAccess: user.parkingLotAccess, // Trả về quyền truy cập cho staff
      },
    });
};

// @desc    Register user (bao gồm cả user thường và admin tạo các role khác)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { username, email, password, name, phone, role } = req.body;

    //Check phone number is exist
    const existingPhone = await User.findOne({ phone, isDeleted: false });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already exists.' });
    }

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

    let userRole = 'user';
    let userVerificationStatus = 'verified';

    // Chỉ cho phép admin tạo các vai trò khác
    if (req.user && req.user.role === 'admin') {
      if (['admin', 'parking_owner', 'staff'].includes(role)) {
        userRole = role;
        // Nếu admin tạo parking_owner, mặc định họ đã được verify
        userVerificationStatus = 'verified';
      }
    } else if (role && role !== 'user') {
      // Nếu không phải admin mà cố gắng đăng ký role khác 'user'
      return res.status(403).json({
        message:
          'Only administrators can register users with roles other than "user".',
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      name,
      phone,
      role: userRole,
      verificationStatus: userVerificationStatus, // Gán trạng thái xác minh ban đầu
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new parking owner with pending status
// @route   POST /api/auth/owner/register
// @access  Public
const registerParkingOwner = async (req, res, next) => {
  try {
    const { username, email, password, name, phone, ownerVerificationImages } =
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

    // Yêu cầu ownerVerificationImages khi đăng ký owner
    if (
      !ownerVerificationImages ||
      !Array.isArray(ownerVerificationImages) ||
      ownerVerificationImages.length === 0
    ) {
      return res.status(400).json({
        message:
          'Owner verification images are required for parking owner registration.',
      });
    }

    // Tạo user với role 'parking_owner' và trạng thái 'pending'
    const user = await User.create({
      username,
      email,
      password,
      name,
      phone,
      role: 'parking_owner', // Gán trực tiếp role 'parking_owner'
      ownerVerificationImages: ownerVerificationImages, // Lưu ảnh xác minh
      verificationStatus: 'pending', // TRẠNG THÁI CHỜ DUYỆT BAN ĐẦU
    });

    // Thông báo cho người dùng rằng tài khoản đang chờ xác minh
    res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        ownerVerificationImages: user.ownerVerificationImages,
        verificationStatus: user.verificationStatus,
      },
      message:
        'Parking owner account created successfully and is awaiting verification by an administrator.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (bao gồm cả user thường và parking_owner)
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
      return res
        .status(401)
        .json({ message: 'Invalid information, user not found' });
    }

    // Kiểm tra trạng thái xác minh cho parking_owner
    if (
      user.role === 'parking_owner' &&
      user.verificationStatus !== 'verified'
    ) {
      if (user.verificationStatus === 'pending') {
        return res.status(403).json({
          message:
            'Your parking owner account is pending verification. Please wait for an administrator to approve it.',
        });
      } else if (user.verificationStatus === 'rejected') {
        return res.status(403).json({
          message:
            'Your parking owner account verification was rejected. Please contact support.',
        });
      }
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
  registerParkingOwner,
  login,
  getMe,
  logout,
};

// const upload = require('../middlewares/multer');
// const multerController = require('../controllers/multerController');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const { on } = require('../models/Booking');

// // Helper để gửi token trong response
// const sendTokenResponse = (user, statusCode, res) => {
//   const token = user.getSignedJwtToken(); // Lấy token từ method của user model

//   const options = {
//     expires: new Date(
//       Date.now() + (process.env.JWT_COOKIE_EXPIRE || 7 * 24 * 60 * 60 * 1000)
//     ), // Cookie hết hạn (ví dụ: 7 ngày)
//     httpOnly: true, // Ngăn chặn truy cập từ client-side script
//   };

//   // Nếu trong môi trường production, chỉ gửi cookie qua HTTPS
//   if (process.env.NODE_ENV === 'production') {
//     options.secure = true;
//   }

//   res
//     .status(statusCode)
//     .cookie('token', token, options)
//     .json({
//       success: true,
//       token,
//       user: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         name: user.name,
//         role: user.role,
//         avatar: user.avatar,
//         ownerVerificationImages: user.ownerVerificationImages || undefined,
//         verificationStatus: user.verificationStatus, // TRẢ VỀ TRẠNG THÁI XÁC MINH
//         // parkingLotAccess: user.parkingLotAccess, // Trả về quyền truy cập cho staff
//       },
//     });
// };

// // @desc    Register user (bao gồm cả user thường và admin tạo các role khác)
// // @route   POST /api/auth/register
// // @access  Public
// const register = async (req, res, next) => {
//   try {
//     const { username, email, password, name, phone, role } = req.body;

//     //Check phone number is exist
//     const existingPhone = await User.findOne({ phone, isDeleted: false });
//     if (existingPhone) {
//       return res.status(400).json({ message: 'Phone number already exists.' });
//     }

//     // Kiểm tra xem username hoặc email đã tồn tại chưa
//     const existingUser = await User.findOne({
//       $or: [{ username }, { email }],
//       isDeleted: false,
//     });
//     if (existingUser) {
//       return res
//         .status(400)
//         .json({ message: 'Username or Email already exists.' });
//     }

//     let userRole = 'user';
//     let userVerificationStatus = 'verified';

//     // Chỉ cho phép admin tạo các vai trò khác
//     if (req.user && req.user.role === 'admin') {
//       if (['admin', 'parking_owner', 'staff'].includes(role)) {
//         userRole = role;
//         // Nếu admin tạo parking_owner, mặc định họ đã được verify
//         userVerificationStatus = 'verified';
//       }
//     } else if (role && role !== 'user') {
//       // Nếu không phải admin mà cố gắng đăng ký role khác 'user'
//       return res.status(403).json({
//         message:
//           'Only administrators can register users with roles other than "user".',
//       });
//     }

//     const user = await User.create({
//       username,
//       email,
//       password,
//       name,
//       phone,
//       role: userRole,
//       verificationStatus: userVerificationStatus, // Gán trạng thái xác minh ban đầu
//     });

//     sendTokenResponse(user, 201, res);
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Register a new parking owner with pending status
// // @route   POST /api/auth/owner/register
// // @access  Public
// const registerParkingOwner = [
//   upload.array('ownerVerificationImages', 10), // Giới hạn tối đa 10 ảnh
//   multerController.upload('ownerVerificationImages'),
//   async (req, res, next) => {
//     try {
//       const {
//         username,
//         email,
//         password,
//         name,
//         phone,
//         // ownerVerificationImages,
//       } = req.body;

//       // Kiểm tra xem username hoặc email đã tồn tại chưa
//       const existingUser = await User.findOne({
//         $or: [{ username }, { email }],
//         isDeleted: false,
//       });
//       if (existingUser) {
//         return res
//           .status(400)
//           .json({ message: 'Username or Email already exists.' });
//       }

//       console.log('req.uploadedUrls:', req.uploadedUrls);
//       console.log(
//         'req.uploadedUrls?.ownerVerificationImages:',
//         req.uploadedUrls?.ownerVerificationImages
//       );

//       const ownerVerificationImages =
//         req.uploadedUrls.ownerVerificationImages || [];
//       if (ownerVerificationImages.length === 0) {
//         return res.status(400).json({
//           message:
//             'Owner verification images are required. Please upload at least one image.',
//         });
//       }

//       const formattedOwnerVerificationImages = `{${ownerVerificationImages.join(
//         ','
//       )}}`;

//       // Tạo user với role 'parking_owner' và trạng thái 'pending'
//       const user = await User.create({
//         username,
//         email,
//         password,
//         name,
//         phone,
//         role: 'parking_owner', // Gán trực tiếp role 'parking_owner'
//         ownerVerificationImages: formattedOwnerVerificationImages, // Lưu ảnh xác minh
//         verificationStatus: 'pending', // TRẠNG THÁI CHỜ DUYỆT BAN ĐẦU
//       });

//       // Thông báo cho người dùng rằng tài khoản đang chờ xác minh
//       res.status(201).json({
//         success: true,
//         user: {
//           _id: user._id,
//           username: user.username,
//           email: user.email,
//           name: user.name,
//           role: user.role,
//           avatar: user.avatar,
//           ownerVerificationImages: user.ownerVerificationImages,
//           verificationStatus: user.verificationStatus,
//         },
//         message:
//           'Parking owner account created successfully and is awaiting verification by an administrator.',
//       });
//     } catch (error) {
//       next(error);
//     }
//   },
// ];

// // @desc    Login user (bao gồm cả user thường và parking_owner)
// // @route   POST /api/auth/login
// // @access  Public
// const login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     // Validate email & password
//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: 'Please enter an email and password' });
//     }

//     // Check for user
//     const user = await User.findOne({ email, isDeleted: false }).select(
//       '+password'
//     ); // Select password explicitly
//     if (!user) {
//       return res
//         .status(401)
//         .json({ message: 'Invalid information, user not found' });
//     }

//     // Kiểm tra trạng thái xác minh cho parking_owner
//     if (
//       user.role === 'parking_owner' &&
//       user.verificationStatus !== 'verified'
//     ) {
//       if (user.verificationStatus === 'pending') {
//         return res.status(403).json({
//           message:
//             'Your parking owner account is pending verification. Please wait for an administrator to approve it.',
//         });
//       } else if (user.verificationStatus === 'rejected') {
//         return res.status(403).json({
//           message:
//             'Your parking owner account verification was rejected. Please contact support.',
//         });
//       }
//     }

//     // Check if password matches
//     const isMatch = await user.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Update last login time
//     user.lastLogin = new Date();
//     await user.save(); // Save the updated lastLogin

//     sendTokenResponse(user, 200, res);
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Get current logged in user
// // @route   GET /api/auth/me
// // @access  Private
// const getMe = async (req, res, next) => {
//   try {
//     // req.user được lấy từ middleware protect
//     const user = await User.findById(req.user._id).select(
//       '-password -refreshToken'
//     );
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.status(200).json({
//       success: true,
//       data: user,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// // @desc    Logout user / clear cookie
// // @route   GET /api/auth/logout
// // @access  Private
// const logout = async (req, res, next) => {
//   // Bạn có thể xóa refreshToken từ DB nếu bạn muốn invalidate token đó
//   // Ví dụ: const user = await User.findById(req.user._id); user.refreshToken = undefined; await user.save();
//   res.cookie('token', 'none', {
//     expires: new Date(Date.now() + 10 * 1000), // Hết hạn ngay lập tức
//     httpOnly: true,
//   });
//   res.status(200).json({
//     success: true,
//     data: {},
//   });
// };

// module.exports = {
//   register,
//   registerParkingOwner,
//   login,
//   getMe,
//   logout,
// };
