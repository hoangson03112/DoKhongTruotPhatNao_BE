const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currency: { type: String, default: 'VND' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'mobile_banking', 'cash'],
      default: 'cash',
    },
    amount: { type: Number }, // Tổng tiền dự kiến (tính toán sau khi checkout xong ở Booking, tính thêm overtimeFree nếu có)
    transactionId: { type: String, unique: true }, // ID giao dịch từ cổng thanh toán
    paidAt: { type: Date }, // Thời điểm thanh toán thành công
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);
paymentSchema.index({ userId: 1, bookingId: 1 });

const Payment = mongoose.model('Payment', paymentSchema, 'payments');
module.exports = Payment;
