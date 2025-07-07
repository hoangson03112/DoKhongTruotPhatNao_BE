const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { connectDB } = require('./db');
const errorHandler = require('./middlewares/errorHandler');
// Load biến môi trường từ .env
dotenv.config();
require('./utils/cronJob');

// Import Swagger
const swaggerUi = require("swagger-ui-express");
// Load your swagger.json (which should reference /auth and /users, not /api/auth)
const swaggerSpec = require('./swaggerConfig'); //Sử dụng cấu hình động thay vì file json như ban đầu

const User = require("./models/User");
const ParkingLot = require("./models/ParkingLot");
const Booking = require("./models/Booking");
// const Review = require('./models/Review');
const PersonalNotification = require('./models/PersonalNotifications');
const BroadcastNotification = require('./models/BroadcastNotification');
const UserBroadcastNotificationStatus = require('./models/UserBroadcastNotificationStatus');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

if (process.env.NODE_ENV === 'production') {
  console.log('production environment mode');
}

let apiBaseUrl = `http://localhost:${PORT}`;
if (process.env.NODE_ENV === 'production') {
  apiBaseUrl = 'https://do-khong-truot-phat-nao.onrender.com';
}

// Cấu hình Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log(`Xem chi tiết tài liệu api tại ${apiBaseUrl}/api-docs`); // Thêm log để dễ dàng truy cập

// Import Routes
const userRoutes = require('./routes/user.routes');
const parkingLotRoutes = require('./routes/parkingLot.routes');
const ownerParkingLotRoutes = require('./routes/owner.parkinglot.routes');
const ownerReservationsRoutes = require('./routes/owner.reservations.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const notificationRoutes = require("./routes/notification.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require('./routes/admin.routes');

// Use Routes
app.use('/api/users', userRoutes);
app.use('/api/parking-lots', parkingLotRoutes);
app.use('/api/owner/parking-lots', ownerParkingLotRoutes);
app.use('/api/owner', ownerReservationsRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/admin', adminRoutes);

//-----------------Test deploying---------------------
app.use('/test', (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Deploy thành công gòi nhe 😸😸😸!',
  });
});

app.use('/', (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message:
      '🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧',
  });
});

// Error handling middleware
app.use(errorHandler);

// Kết nối DB
connectDB()
  .then(() => {
    // Khởi động server
    app.listen(PORT, () => {
      console.log(`🚗 Server đang chạy tại ${apiBaseUrl}`);
    });
  })
  .catch((err) => {
    console.error("Không thể khởi động server do lỗi kết nối DB:", err.message);
  });
