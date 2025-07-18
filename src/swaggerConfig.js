// src/config/swaggerConfig.js

// Lấy biến môi trường. Đảm bảo bạn đã cài đặt và cấu hình dotenv nếu dùng .env
require("dotenv").config();

const swaggerConfig = {
  openapi: "3.0.0",
  info: {
    title: "Parking Management System API",
    version: "1.0.0",
    description:
      "API Documentation for Parking Management System, built with Node.js, Express, and MongoDB.",
    contact: {
      name: "DoKhongTruotPhatNao's Team",
      url: "http://your-website.com",
      email: "your.email@example.com",
    },
  },
  servers: [],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format 'Bearer TOKEN'",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b0",
          },
          username: { type: "string", example: "johndoe" },
          email: {
            type: "string",
            format: "email",
            example: "johndoe@example.com",
          },
          password: {
            type: "string",
            format: "password",
            writeOnly: true,
            description: "Chỉ khi tạo hoặc cập nhật, không trả về",
          },
          name: { type: "string", example: "John Doe", nullable: true },
          phone: { type: "string", example: "0912345678", nullable: true },
          role: {
            type: "string",
            enum: ["user", "admin", "parking_owner", "staff"],
            default: "user",
            example: "user",
          },
          avatar: {
            type: "string",
            format: "url",
            example: "https://example.com/avatars/johndoe.png",
            nullable: true,
          },
          ownerVerificationImages: {
            type: "array",
            items: { type: "string", format: "url" },
            description:
              "Mảng các URL ảnh để xác minh chủ bãi đỗ (ví dụ: ảnh CCCD, giấy phép kinh doanh). Chỉ áp dụng cho role 'parking_owner'.",
            example: [
              "https://example.com/owner_id_front.jpg",
              "https://example.com/owner_id_back.jpg",
            ],
            nullable: true,
          },
          verificationStatus: {
            type: "string",
            enum: ["pending", "verified", "rejected", "not_applicable"],
            default: "not_applicable",
            description:
              "Trạng thái xác minh của người dùng (đặc biệt cho parking_owner).",
            example: "not_applicable",
          },
          refreshToken: {
            type: "string",
            writeOnly: true,
            description: "Token làm mới, không trả về trong public API",
            nullable: true,
          },
          lastLogin: {
            type: "string",
            format: "date-time",
            example: "2025-07-07T08:00:00.000Z",
            nullable: true,
          },
          isDeleted: { type: "boolean", default: false, example: false },
          deletedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: null,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T10:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T10:00:00.000Z",
          },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "password123",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid credentials" },
        },
      },
      Pricing: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b2",
          },
          type: {
            type: "string",
            enum: ["hourly"],
            default: "hourly",
            example: "hourly",
          },
          price: { type: "number", format: "float", example: 15000 },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T10:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T10:00:00.000Z",
          },
        },
      },
      ParkingLot: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b1",
          },
          name: { type: "string", example: "Bãi Đỗ Xe Công Viên Gia Định" },
          address: {
            type: "string",
            example: "Hoàng Minh Giám, Gò Vấp, TP.HCM",
          },
          coordinates: {
            type: "object",
            properties: {
              lat: { type: "number", format: "float", example: 10.8227 },
              lng: { type: "number", format: "float", example: 106.6787 },
            },
          },
          capacity: { type: "integer", example: 200 },
          availableSlots: {
            type: "integer",
            example: 150,
            description: "Số chỗ trống hiện có",
          },
          pricing: {
            type: "array",
            items: { $ref: "#/components/schemas/Pricing" },
            example: [
              { _id: "60d0fe4f3b7d1e0015f8c8b2", type: "hourly", price: 15000 },
            ],
          },
          owner: {
            $ref: "#/components/schemas/User",
            description: "Thông tin chủ sở hữu bãi đỗ",
          },
          images: {
            type: "array",
            items: { type: "string", format: "url" },
            example: [
              "https://example.com/parking1.jpg",
              "https://example.com/parking2.jpg",
            ],
            nullable: true,
          },
          parkingType: {
            type: "string",
            enum: ["official", "unofficial", "temporary"],
            example: "official",
          },
          verificationStatus: {
            type: "string",
            enum: ["pending", "verified", "rejected"],
            default: "pending",
            description: "Trạng thái xác minh của bãi đỗ",
            example: "verified",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T10:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-01-01T10:00:00.000Z",
          },
        },
      },
      Booking: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b3",
          },
          user: {
            $ref: "#/components/schemas/User",
            description: "Thông tin người dùng đặt chỗ",
          },
          parkingLot: {
            $ref: "#/components/schemas/ParkingLot",
            description: "Thông tin bãi đỗ xe",
          },
          parkingLocation: {
            type: "string",
            example: "Khu B Tầng 1",
            nullable: true,
            description: "Vị trí đỗ xe cụ thể trong bãi.",
          },
          startTime: {
            type: "string",
            format: "date-time",
            example: "2025-07-07T10:00:00Z",
          },
          timeCheckOut: {
            type: "string",
            format: "date-time",
            example: "2025-07-07T12:00:00Z",
            nullable: true,
            description: "Thời gian check-out dự kiến.",
          },
          licensePlate: {
            type: "string",
            example: "51F-12345",
            description: "Biển số xe.",
          },
          bookingCode: {
            type: "string",
            example: "abcdEF12",
            description: "Mã đặt chỗ duy nhất.",
          },
          status: {
            type: "string",
            enum: ["pending", "confirmed", "active", "completed", "cancelled"],
            example: "confirmed",
            description: "Trạng thái của đặt chỗ.",
          },
          totalPrice: {
            type: "number",
            format: "float",
            example: 30000,
            nullable: true,
            description:
              "Tổng số tiền phải trả, có thể là null cho đến khi check-out.",
          },
          cancellationPolicy: {
            type: "object",
            properties: {
              maxCancelTime: {
                type: "string",
                format: "date-time",
                example: "2025-07-07T09:00:00Z",
                description: "Thời gian tối đa có thể hủy mà không mất phí.",
              },
              refundPercentage: {
                type: "number",
                format: "float",
                example: 80,
                description:
                  "Phần trăm hoàn tiền nếu hủy trước thời gian cho phép.",
              },
            },
            nullable: true,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-07-07T08:30:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-07-07T08:30:00Z",
          },
        },
      },
      PersonalNotification: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b4",
          },
          userId: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b0",
          },
          title: { type: "string", example: "Xác nhận đặt chỗ thành công" },
          message: {
            type: "string",
            example: "Đặt chỗ của bạn tại Bãi A đã được xác nhận.",
          },
          type: {
            type: "string",
            enum: [
              "booking_confirmation",
              "booking_reminder",
              "booking_cancellation",
              "payment_success",
              "payment_failed",
              "staff_reply",
              "system_alert",
              "owner_verification_status",
              "parking_lot_verification_status",
            ],
            example: "booking_confirmation",
          },
          status: {
            type: "string",
            enum: ["new", "sent", "read", "failed"],
            example: "new",
          },
          relatedId: {
            type: "string",
            format: "ObjectId",
            nullable: true,
            example: "60d0fe4f3b7d1e0015f8c8b3",
            description:
              "ID của đối tượng liên quan (ví dụ: Booking ID, User ID, ParkingLot ID).",
          },
          read: { type: "boolean", example: false },
          link: {
            type: "string",
            format: "url",
            nullable: true,
            example: "/bookings/60d0fe4f3b7d1e0015f8c8b3",
          },
          isDeleted: { type: "boolean", default: false, example: false },
          deletedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: null,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-07-07T08:31:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-07-07T08:31:00Z",
          },
        },
      },
      BroadcastNotification: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b5",
          },
          title: { type: "string", example: "Ưu đãi đặc biệt mùa hè" },
          message: {
            type: "string",
            example: "Giảm 20% cho tất cả các đặt chỗ mới trong tháng 7!",
          },
          type: {
            type: "string",
            enum: [
              "promotion",
              "system_update",
              "general_announcement",
              "parking_lot_news",
            ],
            example: "promotion",
          },
          targetRoles: {
            type: "array",
            items: {
              type: "string",
              enum: ["user", "admin", "parking_owner", "staff"],
            },
            example: ["user"],
            description:
              "Các vai trò người dùng sẽ nhận được thông báo này. Nếu trống, tất cả các vai trò sẽ nhận được.",
          },
          filters: {
            type: "object",
            description: "Các bộ lọc tùy chỉnh (ví dụ: khu vực, loại xe).",
            example: { city: "Hồ Chí Minh" },
            nullable: true,
          },
          link: {
            type: "string",
            format: "url",
            nullable: true,
            example: "/promotions/summer-sale",
          },
          sentAt: {
            type: "string",
            format: "date-time",
            example: "2025-07-01T09:00:00Z",
          },
          expiresAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: "2025-07-31T23:59:59Z",
          },
          isDeleted: { type: "boolean", default: false, example: false },
          deletedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: null,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-07-01T08:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-07-01T08:00:00Z",
          },
        },
      },
      UserBroadcastNotificationStatus: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b6",
          },
          userId: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b0",
          },
          broadcastNotificationId: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b5",
          },
          read: { type: "boolean", example: false },
          dismissedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: null,
          },
          isDeleted: { type: "boolean", default: false, example: false },
          deletedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            example: null,
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-07-01T09:05:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-07-01T09:05:00Z",
          },
        },
      },
      // Input Schemas
      UserInput: {
        type: "object",
        required: ["username", "email", "password"],
        properties: {
          username: { type: "string", example: "johndoe" },
          email: {
            type: "string",
            format: "email",
            example: "johndoe@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "password123",
          },
          name: { type: "string", example: "John Doe", nullable: true },
          phone: { type: "string", example: "0912345678", nullable: true },
          role: {
            type: "string",
            enum: ["user", "admin", "parking_owner", "staff"],
            example: "user",
            nullable: true,
          },
        },
      },
      ParkingOwnerRegisterInput: {
        type: "object",
        required: ["username", "email", "password", "ownerVerificationImages"],
        properties: {
          username: { type: "string", example: "parkingowner123" },
          email: {
            type: "string",
            format: "email",
            example: "owner@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "ownerpass123",
          },
          name: { type: "string", example: "Parking Owner", nullable: true },
          phone: { type: "string", example: "0987654321", nullable: true },
          ownerVerificationImages: {
            type: "array",
            items: { type: "string", format: "url" },
            example: [
              "https://example.com/id_front.jpg",
              "https://example.com/id_back.jpg",
            ],
          },
        },
      },
      UserUpdateInput: {
        type: "object",
        properties: {
          username: { type: "string", example: "newusername" },
          email: {
            type: "string",
            format: "email",
            example: "newemail@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "newpassword123",
          },
          name: { type: "string", example: "New Name" },
          phone: { type: "string", example: "0987654321" },
          avatar: {
            type: "string",
            format: "url",
            example: "https://example.com/avatar.jpg",
          },
        },
      },
      ParkingLotInput: {
        type: "object",
        required: [
          "name",
          "address",
          "coordinates",
          "capacity",
          "images",
          "pricing",
        ],
        properties: {
          name: {
            type: "string",
            example: "Central Parking Lot",
            description: "Tên bãi đỗ xe",
          },
          address: {
            type: "string",
            example: "123 Main Street, District 1, HCMC",
            description: "Địa chỉ bãi đỗ xe",
          },
          coordinates: {
            type: "object",
            required: ["lat", "lng"],
            properties: {
              lat: {
                type: "number",
                format: "float",
                example: 10.8231,
                description: "Vĩ độ",
              },
              lng: {
                type: "number",
                format: "float",
                example: 106.6297,
                description: "Kinh độ",
              },
            },
            description: "Tọa độ GPS của bãi đỗ xe",
          },
          capacity: {
            type: "integer",
            minimum: 1,
            example: 100,
            description: "Sức chứa tối đa của bãi đỗ xe (số chỗ)",
          },
          pricing: {
            type: "array",
            items: {
              type: "string",
              format: "ObjectId",
              example: "60d0fe4f3b7d1e0015f8c8b2",
            },
            description: "Mảng ID của các gói giá (bắt buộc).",
            minItems: 1,
          },
          images: {
            type: "array",
            items: { type: "string", format: "url" },
            example: [
              "https://example.com/parking1.jpg",
              "https://example.com/parking2.jpg",
            ],
            description:
              "Mảng URL hình ảnh của bãi đỗ xe (bắt buộc, ít nhất 1 ảnh)",
            minItems: 1,
          },
        },
      },
      BookingInput: {
        type: "object",
        required: ["parkingLotId", "startTime", "timeCheckOut", "licensePlate"],
        properties: {
          parkingLotId: {
            type: "string",
            format: "ObjectId",
            example: "60d0fe4f3b7d1e0015f8c8b1",
          },
          startTime: {
            type: "string",
            format: "date-time",
            example: "2025-07-07T10:00:00Z",
          },
          timeCheckOut: {
            type: "string",
            format: "date-time",
            example: "2025-07-07T12:00:00Z",
          },
          licensePlate: { type: "string", example: "51F-12345" },
        },
      },
      // Response Schemas
      LoginSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          token: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      GenericSuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Operation successful" },
          data: { type: "object", nullable: true },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Error message",
          },
          errors: {
            type: "array",
            items: {
              type: "string",
            },
            example: ["Field validation error"],
            nullable: true,
          },
        },
        required: ["message"],
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Không được xác thực (token không hợp lệ hoặc thiếu).",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              message: "Not authorized to access this route",
            },
          },
        },
      },
      ForbiddenError: {
        description: "Không có quyền truy cập.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              message: "You are not authorized to perform this action.",
            },
          },
        },
      },
      NotFoundError: {
        description: "Không tìm thấy tài nguyên.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Resource not found." },
          },
        },
      },
      BadRequest: {
        description: "Yêu cầu không hợp lệ (dữ liệu thiếu hoặc sai định dạng).",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Invalid input data." },
          },
        },
      },
      ServerError: {
        description: "Lỗi máy chủ nội bộ.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: { success: false, message: "Internal server error." },
          },
        },
      },
    },
    parameters: {
      UserIdParam: {
        name: "id",
        in: "path",
        required: true,
        description: "ID của người dùng",
        schema: { type: "string", format: "ObjectId" },
        example: "60d0fe4f3b7d1e0015f8c8b0",
      },
      ParkingLotIdParam: {
        name: "id",
        in: "path",
        required: true,
        description: "ID của bãi đỗ xe",
        schema: { type: "string", format: "ObjectId" },
        example: "60d0fe4f3b7d1e0015f8c8b1",
      },
      BookingIdParam: {
        name: "id",
        in: "path",
        required: true,
        description: "ID của đặt chỗ",
        schema: { type: "string", format: "ObjectId" },
        example: "60d0fe4f3b7d1e0015f8c8b3",
      },
      PersonalNotificationIdParam: {
        name: "id",
        in: "path",
        required: true,
        description: "ID của thông báo cá nhân",
        schema: { type: "string", format: "ObjectId" },
        example: "60d0fe4f3b7d1e0015f8c8b4",
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
  paths: {
    // --- AUTH ROUTES ---
    "/auth/register": {
      post: {
        summary: "Đăng ký người dùng mới",
        description:
          "Endpoint này cho phép người dùng đăng ký tài khoản với vai trò 'user'. Lưu ý: Vai trò (role) không thể được chỉ định bởi người dùng tự đăng ký. Nếu role được gửi đến và không phải là 'user', nó sẽ bị bỏ qua hoặc trả về lỗi nếu hệ thống của bạn có logic chặn.",
        tags: ["Xác thực"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserInput" },
              examples: {
                userRegister: {
                  summary: "Đăng ký người dùng thường",
                  value: {
                    username: "newuser123",
                    email: "newuser@example.com",
                    password: "password123",
                    name: "Người Dùng Mới",
                    phone: "0987654321",
                    // role: 'user' (sẽ là mặc định hoặc không cần gửi)
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Đăng ký thành công, trả về token và thông tin user.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginSuccessResponse" },
              },
            },
          },
          400: {
            description:
              "Yêu cầu không hợp lệ (username/email đã tồn tại hoặc thiếu trường).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  duplicateUser: {
                    summary: "Username hoặc Email đã tồn tại",
                    value: {
                      success: false,
                      message: "Username or Email already exists.",
                    },
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/auth/owner/register": {
      post: {
        summary: "Đăng ký chủ bãi đỗ xe",
        description:
          "Endpoint này cho phép một người dùng đăng ký làm chủ bãi đỗ xe. Tài khoản sẽ ở trạng thái 'pending' và yêu cầu 'ownerVerificationImages' để xác minh bởi admin.",
        tags: ["Xác thực"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ParkingOwnerRegisterInput",
              },
              example: {
                username: "new_owner",
                email: "new_owner@example.com",
                password: "ownerpassword123",
                name: "Chủ Bãi Đỗ Mới",
                phone: "0987123456",
                ownerVerificationImages: [
                  "https://example.com/owner_id_front.jpg",
                  "https://example.com/owner_id_back.jpg",
                  "https://example.com/business_license.jpg",
                ],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Đăng ký thành công, tài khoản đang chờ xác minh.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" },
                    message: {
                      type: "string",
                      example:
                        "Parking owner account created successfully and is awaiting verification by an administrator.",
                    },
                  },
                },
              },
            },
          },
          400: {
            description:
              "Yêu cầu không hợp lệ (username/email đã tồn tại, thiếu ảnh xác minh, ...).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  duplicateUser: {
                    summary: "Username hoặc Email đã tồn tại",
                    value: {
                      success: false,
                      message: "Username or Email already exists.",
                    },
                  },
                  missingImages: {
                    summary: "Thiếu ảnh xác minh",
                    value: {
                      success: false,
                      message:
                        "Owner verification images are required for parking owner registration.",
                    },
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Đăng nhập người dùng",
        description: "Đăng nhập vào hệ thống để nhận JWT token.",
        tags: ["Xác thực"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description:
              "Đăng nhập thành công, trả về token và thông tin người dùng.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginSuccessResponse" },
              },
            },
          },
          400: {
            description: "Yêu cầu không hợp lệ (thiếu email/password).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  message: "Please enter an email and password",
                },
              },
            },
          },
          401: {
            description: "Thông tin đăng nhập không hợp lệ.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { success: false, message: "Invalid credentials" },
              },
            },
          },
          403: {
            description:
              "Tài khoản chủ bãi đỗ xe chưa được xác minh hoặc bị từ chối.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  pendingOwner: {
                    summary: "Chủ bãi đang chờ xác minh",
                    value: {
                      success: false,
                      message:
                        "Your parking owner account is pending verification. Please wait for an administrator to approve it.",
                    },
                  },
                  rejectedOwner: {
                    summary: "Chủ bãi bị từ chối",
                    value: {
                      success: false,
                      message:
                        "Your parking owner account verification was rejected. Please contact support.",
                    },
                  },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Lấy thông tin người dùng hiện tại",
        description: "Trả về thông tin chi tiết của người dùng đang đăng nhập.",
        tags: ["Xác thực"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Thông tin người dùng.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/auth/logout": {
      get: {
        summary: "Đăng xuất người dùng",
        description: "Xóa token cookie và đăng xuất người dùng.",
        tags: ["Xác thực"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Đăng xuất thành công.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GenericSuccessResponse" },
                example: {
                  success: true,
                  data: {},
                  message: "Logout successful.",
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // --- USER ROUTES ---
    "/users/profile": {
      get: {
        summary: "Lấy hồ sơ người dùng cá nhân",
        description: "Lấy thông tin hồ sơ của người dùng đang đăng nhập.",
        tags: ["Người dùng"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Thông tin hồ sơ người dùng.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      patch: {
        summary: "Cập nhật hồ sơ người dùng cá nhân",
        description: "Cập nhật thông tin hồ sơ của người dùng đang đăng nhập.",
        tags: ["Người dùng"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserUpdateInput" },
              examples: {
                updateNamePhone: {
                  summary: "Cập nhật tên và số điện thoại",
                  value: { name: "John A. Doe", phone: "0987654321" },
                },
                updatePassword: {
                  summary: "Cập nhật mật khẩu",
                  value: { password: "newSecurePassword123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Hồ sơ người dùng được cập nhật thành công.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // --- PARKING LOT ROUTES (Public) ---
    "/parking-lots": {
      get: {
        summary: "Lấy tất cả bãi đỗ xe (Public)",
        description:
          "Trả về danh sách tất cả bãi đỗ xe có sẵn cho người dùng tìm kiếm.",
        tags: ["Bãi đỗ xe"],
        responses: {
          200: {
            description: "Danh sách các bãi đỗ xe.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ParkingLot" },
                },
              },
            },
          },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      post: {
        summary: "Tạo bãi đỗ xe mới",
        description: "Admin hoặc Parking Owner tạo bãi đỗ xe mới.",
        tags: ["Bãi đỗ xe"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ParkingLotInput" },
              examples: {
                basicParkingLot: {
                  summary: "Bãi đỗ xe cơ bản (tất cả required fields)",
                  value: {
                    name: "Bãi Đỗ Xe Trung Tâm",
                    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
                    coordinates: {
                      lat: 10.8231,
                      lng: 106.6297,
                    },
                    capacity: 100,
                    pricing: ["60d0fe4f3b7d1e0015f8c8b2"],
                    images: ["https://example.com/parking-entrance.jpg"],
                  },
                },
                fullParkingLot: {
                  summary: "Bãi đỗ xe đầy đủ thông tin",
                  value: {
                    name: "Parking Lot VinCom Center",
                    address: "70-72 Lê Thánh Tôn, Quận 1, TP.HCM",
                    coordinates: {
                      lat: 10.7769,
                      lng: 106.7009,
                    },
                    capacity: 200,
                    pricing: [
                      "60d0fe4f3b7d1e0015f8c8b2",
                      "60d0fe4f3b7d1e0015f8c8b3",
                    ],
                    images: [
                      "https://example.com/parking-entrance.jpg",
                      "https://example.com/parking-interior.jpg",
                      "https://example.com/parking-overview.jpg",
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Bãi đỗ xe được tạo thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Parking lot created successfully",
                    },
                    data: { $ref: "#/components/schemas/ParkingLot" },
                  },
                },
              },
            },
          },
          400: {
            description:
              "Yêu cầu không hợp lệ (thiếu field bắt buộc, dữ liệu không đúng định dạng).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  missingFields: {
                    summary: "Thiếu trường bắt buộc",
                    value: {
                      success: false,
                      message:
                        "Missing required fields: name, address, coordinates, capacity, images, pricing",
                    },
                  },
                  missingImages: {
                    summary: "Thiếu hoặc ảnh rỗng",
                    value: {
                      success: false,
                      message:
                        "At least one image is required for the parking lot",
                    },
                  },
                  invalidCoordinates: {
                    summary: "Coordinates không hợp lệ",
                    value: {
                      success: false,
                      message: "Coordinates must include lat and lng",
                    },
                  },
                  invalidCapacity: {
                    summary: "Capacity không hợp lệ",
                    value: {
                      success: false,
                      message: "Capacity must be a positive number",
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/parking-lots/reservations": {
      get: {
        summary: "Lấy bãi đỗ xe của chủ sở hữu",
        description:
          "Parking Owner lấy danh sách bãi đỗ xe của mình để quản lý.",
        tags: ["Bãi đỗ xe"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Danh sách bãi đỗ xe.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ParkingLot" },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/parking-lots/reservations/{id}": {
      get: {
        summary: "Lấy chi tiết bãi đỗ xe cho Owner",
        description:
          "Parking Owner lấy chi tiết một bãi đỗ xe cụ thể để quản lý.",
        tags: ["Bãi đỗ xe"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ParkingLotIdParam" }],
        responses: {
          200: {
            description: "Chi tiết bãi đỗ xe.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ParkingLot" },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/parking-lots/{id}": {
      get: {
        summary: "Lấy chi tiết bãi đỗ xe theo ID (Public)",
        description:
          "Lấy thông tin chi tiết của một bãi đỗ xe cụ thể để người dùng xem thông tin trước khi đặt chỗ.",
        tags: ["Bãi đỗ xe"],
        parameters: [{ $ref: "#/components/parameters/ParkingLotIdParam" }],
        responses: {
          200: {
            description: "Chi tiết bãi đỗ xe.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ParkingLot" },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // --- OWNER PARKING LOT ROUTES ---
    "/owner/parking-lots": {
      get: {
        summary: "Lấy danh sách bãi đỗ xe của chủ sở hữu",
        description:
          "Trả về danh sách các bãi đỗ xe thuộc sở hữu của người dùng hiện tại. Yêu cầu quyền Parking Owner.",
        tags: ["Bãi đỗ xe (Chủ sở hữu)"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Danh sách các bãi đỗ xe.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ParkingLot" },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      post: {
        summary: "Tạo bãi đỗ xe mới (Owner)",
        description:
          'Chủ bãi đỗ xe tạo một bãi đỗ xe mới. Bãi đỗ xe sẽ ở trạng thái "pending" và cần được Admin xác minh.',
        tags: ["Bãi đỗ xe (Chủ sở hữu)"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ParkingLotInput" },
              examples: {
                basicParkingLot: {
                  summary: "Bãi đỗ xe cơ bản (tất cả required fields)",
                  value: {
                    name: "Bãi Đỗ Xe Trung Tâm",
                    address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
                    coordinates: {
                      lat: 10.8231,
                      lng: 106.6297,
                    },
                    capacity: 100,
                    pricing: ["60d0fe4f3b7d1e0015f8c8b2"],
                    images: ["https://example.com/parking-entrance.jpg"],
                  },
                },
                fullParkingLot: {
                  summary: "Bãi đỗ xe đầy đủ thông tin",
                  value: {
                    name: "Parking Lot VinCom Center",
                    address: "70-72 Lê Thánh Tôn, Quận 1, TP.HCM",
                    coordinates: {
                      lat: 10.7769,
                      lng: 106.7009,
                    },
                    capacity: 200,
                    pricing: ["60d0fe4f3b7d1e0015f8c8b2"],
                    images: [
                      "https://example.com/parking-entrance.jpg",
                      "https://example.com/parking-interior.jpg",
                      "https://example.com/parking-overview.jpg",
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Bãi đỗ xe được tạo thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Parking lot created successfully",
                    },
                    data: { $ref: "#/components/schemas/ParkingLot" },
                  },
                },
              },
            },
          },
          400: {
            description:
              "Yêu cầu không hợp lệ (thiếu field bắt buộc, dữ liệu không đúng định dạng).",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  missingFields: {
                    summary: "Thiếu trường bắt buộc",
                    value: {
                      success: false,
                      message:
                        "Missing required fields: name, address, coordinates, capacity, images, pricing",
                    },
                  },
                  missingImages: {
                    summary: "Thiếu hoặc ảnh rỗng",
                    value: {
                      success: false,
                      message:
                        "At least one image is required for the parking lot",
                    },
                  },
                  invalidCoordinates: {
                    summary: "Coordinates không hợp lệ",
                    value: {
                      success: false,
                      message: "Coordinates must include lat and lng",
                    },
                  },
                  invalidCapacity: {
                    summary: "Capacity không hợp lệ",
                    value: {
                      success: false,
                      message: "Capacity must be a positive number",
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/owner/parking-lots/{id}": {
      put: {
        summary: "Cập nhật bãi đỗ xe (Owner)",
        description: "Chủ bãi đỗ xe cập nhật trạng thái bãi đỗ xe của mình.",
        tags: ["Bãi đỗ xe (Chủ sở hữu)"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ParkingLotIdParam" }],
        responses: {
          200: {
            description: "Cập nhật thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Parking lot status updated successfully",
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      delete: {
        summary: "Xóa bãi đỗ xe (Owner)",
        description: "Chủ bãi đỗ xe xóa mềm bãi đỗ xe của mình.",
        tags: ["Bãi đỗ xe (Chủ sở hữu)"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ParkingLotIdParam" }],
        responses: {
          200: {
            description: "Xóa thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example:
                        "Parking Lot and associated spots soft deleted successfully",
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // --- OWNER RESERVATIONS ROUTES ---
    "/owner/{id}/reservations": {
      get: {
        summary: "Lấy danh sách đặt chỗ theo bãi đỗ xe",
        description: "Owner lấy tất cả đặt chỗ của một bãi đỗ xe cụ thể.",
        tags: ["Parking Owner"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ParkingLotIdParam" }],
        responses: {
          200: {
            description: "Danh sách đặt chỗ.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "integer", example: 5 },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Booking" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/owner/reservations/{id}": {
      put: {
        summary: "Cập nhật đặt chỗ (Owner)",
        description: "Owner cập nhật trạng thái đặt chỗ.",
        tags: ["Parking Owner"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/BookingIdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: [
                      "pending",
                      "confirmed",
                      "active",
                      "completed",
                      "cancelled",
                    ],
                    example: "confirmed",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Cập nhật đặt chỗ thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Reservation updated successfully.",
                    },
                    data: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // --- BOOKING ROUTES ---
    "/bookings": {
      post: {
        summary: "Tạo đặt chỗ mới",
        description:
          "Người dùng tạo một đặt chỗ mới cho bãi đỗ xe. Logic tính giá và kiểm tra chỗ trống sẽ được xử lý tự động.",
        tags: ["Đặt chỗ"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BookingInput" },
            },
          },
        },
        responses: {
          201: {
            description: "Đặt chỗ được tạo thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Booking" },
                    message: {
                      type: "string",
                      example:
                        "Booking created successfully. Please note your booking code for check-in.",
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      get: {
        summary: "Lấy tất cả đặt chỗ của người dùng hiện tại",
        description:
          "Trả về danh sách các đặt chỗ mà người dùng đang đăng nhập đã thực hiện, trừ các đặt chỗ đã hủy.",
        tags: ["Đặt chỗ"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Danh sách đặt chỗ của người dùng.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    count: { type: "integer", example: 2 },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Booking" },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/bookings/{id}": {
      get: {
        summary: "Lấy chi tiết đặt chỗ theo ID",
        description:
          "Lấy thông tin chi tiết của một đặt chỗ cụ thể. Chỉ người dùng đặt chỗ, admin, hoặc chủ bãi/staff của bãi đỗ xe liên quan mới có thể truy cập.",
        tags: ["Đặt chỗ"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/BookingIdParam" }],
        responses: {
          200: {
            description: "Chi tiết đặt chỗ.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      delete: {
        summary: "Hủy đặt chỗ theo ID",
        description:
          "Hủy một đặt chỗ. Có thể được thực hiện bởi người dùng đặt chỗ, admin, hoặc chủ bãi/staff của bãi đỗ xe liên quan, tuỳ thuộc vào trạng thái đặt chỗ và chính sách hủy.",
        tags: ["Đặt chỗ"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/BookingIdParam" }],
        responses: {
          200: {
            description: "Đặt chỗ đã được hủy thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Booking cancelled successfully.",
                    },
                    data: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/bookings/{id}/checkin": {
      patch: {
        summary: "Check-in xe vào bãi đỗ",
        description:
          'Admin/Owner/Staff xác nhận xe đã check-in vào bãi đỗ, chuyển trạng thái booking từ "confirmed" sang "active".',
        tags: ["Đặt chỗ"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/BookingIdParam" }],
        responses: {
          200: {
            description: "Check-in thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Vehicle checked in successfully.",
                    },
                    data: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          400: {
            description: 'Chỉ có booking "confirmed" mới có thể check-in.',
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  message: "Only confirmed bookings can be checked in.",
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/bookings/{id}/checkout": {
      patch: {
        summary: "Check-out xe khỏi bãi đỗ",
        description:
          'Admin/Owner/Staff xác nhận xe đã check-out khỏi bãi đỗ, chuyển trạng thái booking từ "active" sang "completed".',
        tags: ["Đặt chỗ"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/BookingIdParam" }],
        responses: {
          200: {
            description: "Check-out thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: {
                      type: "string",
                      example: "Vehicle checked out successfully.",
                    },
                    data: { $ref: "#/components/schemas/Booking" },
                  },
                },
              },
            },
          },
          400: {
            description: 'Chỉ có booking "active" mới có thể check-out.',
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  message: "Only active bookings can be checked out.",
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },

    // --- ADMIN ROUTES ---
    "/admin/users": {
      get: {
        summary: "Lấy tất cả người dùng (Admin)",
        description: "Admin lấy danh sách tất cả người dùng trong hệ thống.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Danh sách người dùng.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      post: {
        summary: "Tạo người dùng mới (Admin)",
        description: "Admin tạo người dùng với bất kỳ role nào.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserInput" },
            },
          },
        },
        responses: {
          201: { $ref: "#/components/schemas/LoginSuccessResponse" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/admin/users/{id}": {
      put: {
        summary: "Cập nhật trạng thái xác minh người dùng (Admin)",
        description: "Admin cập nhật verificationStatus của người dùng.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UserIdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["pending", "verified", "rejected"],
                    example: "verified",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Cập nhật thành công.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GenericSuccessResponse" },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      delete: {
        summary: "Xóa mềm người dùng (Admin)",
        description: "Admin xóa mềm người dùng.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UserIdParam" }],
        responses: {
          200: { $ref: "#/components/schemas/GenericSuccessResponse" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/admin/owners": {
      get: {
        summary: "Lấy tất cả chủ bãi đỗ xe (Admin)",
        description: "Admin lấy danh sách tất cả chủ bãi đỗ xe.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Danh sách chủ bãi đỗ xe.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/admin/owners/{id}": {
      put: {
        summary: "Cập nhật trạng thái chủ bãi đỗ xe (Admin)",
        description: "Admin cập nhật verificationStatus của chủ bãi đỗ xe.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UserIdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["pending", "verified", "rejected"],
                    example: "verified",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { $ref: "#/components/schemas/GenericSuccessResponse" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      delete: {
        summary: "Xóa mềm chủ bãi đỗ xe (Admin)",
        description: "Admin xóa mềm chủ bãi đỗ xe.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/UserIdParam" }],
        responses: {
          200: { $ref: "#/components/schemas/GenericSuccessResponse" },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/admin/parking-lots": {
      get: {
        summary: "Lấy tất cả bãi đỗ xe (Admin)",
        description: "Admin lấy danh sách tất cả bãi đỗ xe.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Danh sách bãi đỗ xe.",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ParkingLot" },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
    "/admin/parking-lots/{id}": {
      put: {
        summary: "Cập nhật trạng thái bãi đỗ xe (Admin)",
        description: "Admin cập nhật trạng thái active/inactive của bãi đỗ xe.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ParkingLotIdParam" }],
        responses: {
          200: {
            description: "Cập nhật thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Parking lot status updated successfully",
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
      delete: {
        summary: "Xóa mềm bãi đỗ xe (Admin)",
        description: "Admin xóa mềm bãi đỗ xe.",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: "#/components/parameters/ParkingLotIdParam" }],
        responses: {
          200: {
            description: "Xóa thành công.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example:
                        "Parking Lot and associated spots soft deleted successfully",
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/UnauthorizedError" },
          403: { $ref: "#/components/responses/ForbiddenError" },
          404: { $ref: "#/components/responses/NotFoundError" },
          500: { $ref: "#/components/responses/ServerError" },
        },
      },
    },
  },
};
// Logic để thêm server URL dựa trên môi trường
if (process.env.NODE_ENV === "production") {
  swaggerConfig.servers.push({
    url: "https://do-khong-truot-phat-nao.onrender.com/api", // URL API production của bạn
    description: "Production Server",
  });
  console.log(
    "Server URL api: https://do-khong-truot-phat-nao.onrender.com/api"
  );
} else {
  const PORT = process.env.PORT;
  // Mặc định là development hoặc local
  swaggerConfig.servers.push({
    url: `http://localhost:${PORT}/api`, // URL API local của bạn
    description: "Local Development Server",
  });
  console.log(`Server URL api: http://localhost:${PORT}/api`);
}

module.exports = swaggerConfig;
