const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "card", "momo", "zalopay", "viettelmoney", "vnpay"],
    required: true,
  },
  transactionId: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
PaymentSchema.index({ userId: 1, bookingId: 1 });

const Payment = mongoose.model("Payment", PaymentSchema, "payments");
module.exports = Payment;
