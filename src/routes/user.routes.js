const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  softDeleteUser,
} = require('../controllers/user.controller');
const { protect, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router
  .route('/profile')
  .get(protect, getUserProfile)
  .patch(protect, updateUserProfile);
router.route('/').get(protect, authorizeRoles('admin'), getAllUsers);
router.route('/:id').delete(protect, authorizeRoles('admin'), softDeleteUser);

module.exports = router;
