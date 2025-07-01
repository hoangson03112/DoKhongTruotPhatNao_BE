const mongoose = require('mongoose');

// Model User
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    phone: { type: String },
    role: { type: String, default: 'user' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
