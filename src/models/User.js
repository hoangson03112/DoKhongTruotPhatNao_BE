const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Model User
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    phone: { type: String },
    role: {
      type: String,
      enum: ['user', 'admin', 'parking_owner', 'staff'],
      default: 'user',
    },
    avatar: { type: String },
    // TRƯỜNG MỚI: Để lưu trữ ảnh xác minh cho chủ bãi đỗ
    ownerVerificationImages: {
      type: [String], // Mảng các URL ảnh
      default: [],
    },
    // TRƯỜNG MỚI: Trạng thái xác minh của người dùng (đặc biệt cho parking_owner)
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'not_applicable'], // "not_applicable" cho user/admin/staff không cần xác minh
      default: 'not_applicable',
    },
    refreshToken: { type: String },
    lastLogin: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// So sánh mật khẩu đã nhập với mật khẩu đã hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Tạo và trả về JWT token
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const User = mongoose.model('User', userSchema, 'user');
module.exports = User;
