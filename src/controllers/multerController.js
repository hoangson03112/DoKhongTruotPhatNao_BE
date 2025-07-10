const { uploadFile } = require('../utils/cloudinaryUtils');
const fs = require('fs').promises;

// Middleware để upload tệp
exports.upload = (fieldName) => {
  return async (req, res, next) => {
    try {
      console.log('multer req.file:', req.file);
      console.log('multer req.files:', req.files);

      if (!req.file && !req.files) {
        console.log('Không có tệp nào để upload, tiếp tục mà không upload ảnh');
        req.uploadedUrls = req.uploadedUrls || {};
        req.uploadedUrls[fieldName] = []; // Gán mảng rỗng để đồng bộ với logic
        return next();
      }

      if (!req.uploadedUrls) req.uploadedUrls = {};

      if (req.file) {
        // Trường hợp upload.single (avatarUrl)
        try {
          const type = req.body.type || 'image';
          const result = await uploadFile(req.file, type);
          req.uploadedUrls[fieldName] = result.url; // Lưu URL vào req.uploadedUrls[fieldName]
          console.log(
            `Uploaded URL for ${fieldName}:`,
            req.uploadedUrls[fieldName]
          );

          // Xóa file tạm sau khi upload
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Lỗi xóa file tạm:', unlinkError.message);
            // Không throw error vì upload đã thành công
          }

          return next();
        } catch (uploadError) {
          console.error('Lỗi upload file:', uploadError.message);
          // Xóa file tạm nếu upload thất bại
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Lỗi xóa file tạm:', unlinkError.message);
          }
          throw uploadError;
        }
      } else if (req.files) {
        // Trường hợp upload.array - req.files luôn là array khi dùng upload.array()
        const files = Array.isArray(req.files) ? req.files : [];

        if (!files || files.length === 0) {
          console.log(
            'Không có tệp nào trong req.files, tiếp tục mà không upload ảnh'
          );
          req.uploadedUrls[fieldName] = [];
          return next();
        }

        // Kiểm tra số lượng file tối đa
        if (files.length > 10) {
          // Xóa tất cả file tạm vì vượt quá giới hạn
          await Promise.allSettled(files.map((file) => fs.unlink(file.path)));
          return next(
            new Error('Số lượng file vượt quá giới hạn (tối đa 10 file).')
          );
        }

        const type = req.body.type || 'image';
        const uploadedUrls = [];
        const uploadPromises = [];

        // Upload tất cả file song song để tăng hiệu suất
        for (const file of files) {
          uploadPromises.push(
            uploadFile(file, type)
              .then((result) => ({
                success: true,
                url: result.url,
                file: file,
              }))
              .catch((error) => ({
                success: false,
                error: error,
                file: file,
              }))
          );
        }

        try {
          const results = await Promise.all(uploadPromises);

          // Kiểm tra kết quả upload
          const failedUploads = results.filter((result) => !result.success);

          if (failedUploads.length > 0) {
            console.error('Một số file upload thất bại:', failedUploads);
            // Vẫn xóa tất cả file tạm
            await Promise.allSettled(files.map((file) => fs.unlink(file.path)));

            // Throw lỗi của file đầu tiên thất bại
            throw failedUploads[0].error;
          }

          // Lấy URLs từ kết quả thành công
          results.forEach((result) => {
            if (result.success) {
              uploadedUrls.push(result.url);
            }
          });

          req.uploadedUrls[fieldName] = uploadedUrls;
          console.log(
            `Uploaded URLs for ${fieldName}:`,
            req.uploadedUrls[fieldName]
          );

          // Xóa tất cả file tạm sau khi upload thành công
          const unlinkResults = await Promise.allSettled(
            files.map((file) => fs.unlink(file.path))
          );

          // Log các lỗi xóa file nhưng không throw
          unlinkResults.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.error(
                `Lỗi xóa file tạm ${files[index].filename}:`,
                result.reason.message
              );
            }
          });

          return next();
        } catch (error) {
          console.error('Lỗi trong quá trình upload:', error.message);

          // Xóa tất cả file tạm ngay cả khi có lỗi
          await Promise.allSettled(files.map((file) => fs.unlink(file.path)));

          throw error;
        }
      }
    } catch (error) {
      console.error('Lỗi trong multerController.upload:', error.message);

      // Cleanup files trong trường hợp lỗi
      const cleanupPromises = [];

      if (req.file && req.file.path) {
        cleanupPromises.push(fs.unlink(req.file.path).catch(() => {}));
      }

      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : [];
        files.forEach((file) => {
          if (file && file.path) {
            cleanupPromises.push(fs.unlink(file.path).catch(() => {}));
          }
        });
      }

      if (cleanupPromises.length > 0) {
        await Promise.allSettled(cleanupPromises);
      }

      next(error);
    }
  };
};

// Handler cho endpoint /upload (giữ nguyên)
exports.uploadHandler = async (req, res) => {
  try {
    if (req.uploadedUrls && req.uploadedUrls.imagesUrl) {
      res.status(200).json({
        message: 'Upload nhiều tệp thành công.',
        urls: req.uploadedUrls.imagesUrl,
      });
    } else if (req.uploadedUrls && Object.keys(req.uploadedUrls).length > 0) {
      const fieldName = Object.keys(req.uploadedUrls)[0];
      res.status(200).json({
        message: 'Upload thành công.',
        url: req.uploadedUrls[fieldName],
      });
    } else {
      res.status(400).json({
        message: 'Không có URL nào được trả về sau khi upload.',
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
