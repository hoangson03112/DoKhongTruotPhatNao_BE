const express = require("express");
const dotenv = require("dotenv");
const { connectDB } = require("./db");
const userRoutes = require("./routes/user.routes");
const carRoutes = require("./routes/car.routes");
const bookingRoutes = require("./routes/booking.routes");

// Load biến môi trường từ .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để parse JSON
app.use(express.json());

// Kết nối DB
connectDB()
  .then(() => {
    // Route mẫu
    app.get("/", (req, res) => {
      res.send("API Đặt lịch xe ô tô hoạt động!");
    });

    // Route user
    app.use("/api/users", userRoutes);

    // Route car
    app.use("/api/cars", carRoutes);

    // Route booking
    app.use("/api/bookings", bookingRoutes);

    // Khởi động server
    app.listen(PORT, () => {
      console.log(`🚗 Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Không thể khởi động server do lỗi kết nối DB:", err.message);
  });
