const mongoose = require('mongoose');
const shortid = require('shortid');

// Lượt đặt chỗ / để xe (có thể đặt trước)
const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parkingLot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true,
  },
  parkingLocation: {
    type: String,
    trim: true,
    maxlength: [100, 'Parking location must not exceed 100 characters'],
  },
  startTime: {
    type: Date,
    required: true,
  },
  timeCheckOut: {
    // same with endTime
    type: Date,
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{2}[A-Z]{1,2}-\d{4,5}$/, 'Invalid car license plate format'],
  },
  bookingCode: {
    type: String,
    unique: true,
    default: shortid.generate,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  totalPrice: {
    type: Number,
    min: 0,
    default: 0,
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

// HOOK PRE-SAVE ĐÃ SỬA ĐỔI ĐỂ PHÙ HỢP VỚI PRICING MODEL CHỈ CÓ 'HOURLY'
BookingSchema.pre('save', async function (next) {
  // Chỉ chạy logic phức tạp khi tạo mới hoặc các trường liên quan đến thời gian thay đổi
  if (
    this.isNew ||
    this.isModified('startTime') ||
    this.isModified('timeCheckOut')
  ) {
    const parkingLot = await mongoose
      .model('ParkingLot')
      .findById(this.parkingLot)
      .populate('pricing'); // Populate pricing để có thông tin giá đầy đủ

    if (!parkingLot) {
      throw new Error('Parking lot not found.');
    }

    // Kiểm tra số chỗ trống chỉ khi tạo mới booking
    if (this.isNew && parkingLot.availableSlots <= 0) {
      throw new Error('No available slots in this parking lot');
    }

    // Kiểm tra startTime không quá xa (tối đa 24 giờ tới)
    const now = new Date();
    if (this.startTime > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      throw new Error('startTime cannot be more than 24 hours in the future');
    }

    // Kiểm tra timeCheckOut phải sau startTime và phải tồn tại nếu muốn tính giá
    if (!this.timeCheckOut) {
      throw new Error(
        'timeCheckOut is required for booking duration calculation.'
      );
    }
    if (this.startTime >= this.timeCheckOut) {
      throw new Error('timeCheckOut must be after startTime.');
    }

    // Lấy thông tin giá (chỉ có 'hourly' theo Pricing model hiện tại)
    // Giả định chỉ có một cấu hình giá 'hourly' trong mảng pricing hoặc lấy cái đầu tiên
    const hourlyPricing = parkingLot.pricing.find((p) => p.type === 'hourly');
    if (!hourlyPricing) {
      throw new Error(
        'Hourly pricing not found for this parking lot. Cannot calculate price.'
      );
    }
    const pricePerHour = hourlyPricing.price;

    // Tính giá theo giờ
    const durationMs = this.timeCheckOut.getTime() - this.startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60); // Giờ
    this.totalPrice = pricePerHour * Math.ceil(durationHours);

    // Giảm số chỗ trống chỉ khi tạo mới booking (đảm bảo không giảm 2 lần)
    if (this.isNew) {
      parkingLot.availableSlots -= 1;
      await parkingLot.save();
    }
  }
  next();
});

// HOOK POST-SAVE CỦA BẠN (Giữ nguyên logic)
BookingSchema.post('save', async function (doc, next) {
  // Chỉ tăng slot khi booking bị hủy hoặc hoàn thành
  if (doc.status === 'cancelled' || doc.status === 'completed') {
    const parkingLot = await mongoose
      .model('ParkingLot')
      .findById(doc.parkingLot);
    // Đảm bảo parkingLot tồn tại và availableSlots không vượt quá capacity
    if (parkingLot && parkingLot.availableSlots < parkingLot.capacity) {
      parkingLot.availableSlots += 1;
      await parkingLot.save();
    }
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema, 'bookings');
