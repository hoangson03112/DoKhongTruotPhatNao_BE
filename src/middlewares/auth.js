const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model

// Middleware để bảo vệ các route (xác thực người dùng)
const protect = async (req, res, next) => {
  let token;

  // 1. Kiểm tra token trong Header (Bearer Token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Hoặc kiểm tra token trong Cookie (nếu bạn sử dụng cookie)
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Kiểm tra nếu không có token
  if (!token) {
    return res.status(401).json({
      message: 'Not authorized to access this route, no token provided',
    });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm người dùng dựa trên ID trong token và gán vào req.user
    // Bỏ qua password và refreshToken khi gán vào req.user
    req.user = await User.findById(decoded.id).select(
      '-password -refreshToken'
    );

    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    console.error('Error in protect middleware:', error.message);
    return res
      .status(401)
      .json({ message: 'Not authorized to access this route, token failed' });
  }
};

// Middleware để phân quyền theo vai trò
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Đảm bảo req.user đã được populate bởi middleware 'protect'
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${
          req.user.role
        } is not authorized to access this route. Required roles: ${roles.join(
          ', '
        )}`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
