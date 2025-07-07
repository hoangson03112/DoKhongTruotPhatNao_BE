const express = require('express');
const {
  register,
  registerParkingOwner,
  login,
  getMe,
  logout,
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register); // Chỉ Admin mới được tạo các user có role khác 'user'
router.post('/owner/register', registerParkingOwner); // Chỉ Admin mới được tạo các user có role khác 'user'
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
