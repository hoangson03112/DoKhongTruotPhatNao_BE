const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { connectDB } = require('./db');
const errorHandler = require('./middlewares/errorHandler');

// Import Swagger
const swaggerUi = require('swagger-ui-express');
// Load your swagger.json (which should reference /auth and /users, not /api/auth)
const swaggerDocument = require('./swagger.json');

const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const ParkingLot = require('./models/ParkingLot');
const ParkingSpot = require('./models/ParkingSpot');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Review = require('./models/Review');
const PersonalNotification = require('./models/PersonalNotifications');
const {
  BroadcastNotification,
  UserNotificationStatus,
} = require('./models/UserBroadcastNotificationStatus');

// Load biến môi trường từ .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Cấu hình Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
console.log(`Xem chi tiết tài liệu api tại http://localhost:${PORT}/api-docs`); // Thêm log để dễ dàng truy cập

// Import Routes
const userRoutes = require('./routes/user.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const parkingLotRoutes = require('./routes/parkingLot.routes');
const parkingSpotRoutes = require('./routes/parkingSpot.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const reviewRoutes = require('./routes/review.routes');
const notificationRoutes = require('./routes/notification.routes');
const authRoutes = require('./routes/auth.routes');
// const adminRoutes = require('./routes/admin.routes'); // Add if you create admin routes

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking-lots', parkingLotRoutes);
app.use('/api/parking-spots', parkingSpotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use(errorHandler);

// Kết nối DB
connectDB()
  .then(() => {
    // Khởi động server
    app.listen(PORT, () => {
      console.log(`🚗 Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Không thể khởi động server do lỗi kết nối DB:', err.message);
  });
