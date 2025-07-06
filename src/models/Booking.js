const mongoose = require("mongoose");

// Lượt đặt chỗ / để xe (có thể đặt trước)
const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ParkingLot",
    required: true,
  },
  parkingLocation: {
    type: String,
    trim: true,
    maxlength: [100, "Parking location must not exceed 100 characters"],
  },
  startTime: {
    type: Date,
    required: true,
  },
  timeCheckout: {
    type: Date,
  },
  vehicleType: {
    type: String,
    enum: ["car"],
    required: true,
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{2}[A-Z]{1,2}-\d{4,5}$/, "Invalid car license plate format"],
  },
  bookingCode: {
    type: String,
    unique: true,
    default: shortid.generate,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },
  cancellationPolicy: {
    maxCancelTime: { type: Date },
    refundPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
BookingSchema.index({ parkingLot: 1, status: 1 });
BookingSchema.index({ user: 1, status: 1 });

BookingSchema.pre("save", async function (next) {
  if (
    this.isNew ||
    this.isModified("startTime") ||
    this.isModified("endTime") ||
    this.isModified("pricingType")
  ) {
    const parkingLot = await mongoose
      .model("ParkingLot")
      .findById(this.parkingLot);

    // Kiểm tra số chỗ trống
    if (parkingLot.availableSlots <= 0) {
      throw new Error("No available slots in this parking lot");
    }

    // Kiểm tra startTime không quá xa (tối đa 24 giờ tới)
    const now = new Date();
    if (this.startTime > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      throw new Error("startTime cannot be more than 24 hours in the future");
    }

    // Tính giá
    const pricing = parkingLot.pricing.find(
      (p) => p.type === this.pricingType && p.vehicleType === this.vehicleType
    );
    if (!pricing) {
      throw new Error("Pricing not found for the selected type and vehicle");
    }
    const { price, maxDuration } = pricing;

    if (this.pricingType === "per_entry") {
      this.totalPrice = price;
      if (maxDuration && this.endTime) {
        const duration = (this.endTime - this.startTime) / (1000 * 60 * 60); // Giờ
        if (duration > maxDuration) {
          throw new Error(
            `Booking duration exceeds maximum allowed time (${maxDuration} hours) for per_entry pricing`
          );
        }
      } else if (maxDuration && !this.endTime) {
        // Tự động gán endTime = startTime + maxDuration
        this.endTime = new Date(
          this.startTime.getTime() + maxDuration * 60 * 60 * 1000
        );
      }
    } else if (this.pricingType === "hourly") {
      const duration = (this.endTime - this.startTime) / (1000 * 60 * 60); // Giờ
      this.totalPrice = price * Math.ceil(duration);
    } else if (this.pricingType === "daily") {
      const duration = (this.endTime - this.startTime) / (1000 * 60 * 60); // Giờ
      this.totalPrice = price * Math.ceil(duration / 24);
    } else if (this.pricingType === "monthly") {
      this.totalPrice = price;
    }

    // Giảm số chỗ trống
    parkingLot.availableSlots -= 1;
    await parkingLot.save();
  }
  next();
});
BookingSchema.post("save", async function (doc, next) {
  if (doc.status === "cancelled" || doc.status === "completed") {
    const parkingLot = await mongoose
      .model("ParkingLot")
      .findById(doc.parkingLot);
    parkingLot.availableSlots += 1;
    await parkingLot.save();
  }
  next();
});
module.exports = mongoose.model("Booking", BookingSchema, "bookings");
