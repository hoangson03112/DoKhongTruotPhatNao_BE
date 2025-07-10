const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads')); // Đường dẫn tuyệt đối: backend/uploads/
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'video/mp4',
      'image/jpg',
      'image/webp',
      'image/gif',
      'image/heic',
      'image/heif',
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Chỉ hỗ trợ ảnh JPEG, PNG hoặc video MP4.'));
    }
    cb(null, true);
  },
});

module.exports = upload;
