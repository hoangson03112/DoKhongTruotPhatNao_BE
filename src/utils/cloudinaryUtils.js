const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const imageSize = require('image-size');

// Biến toàn cục để theo dõi tài khoản hiện tại
let currentAccountNumber = 1;
const TOTAL_ACCOUNTS = 1;
const accountStateFile = 'cloudinary-account.json';

// Cấu hình Cloudinary ban đầu
let CLOUD_NAME = process.env[`CLOUD_NAME_${currentAccountNumber}`];
let API_KEY = process.env[`CLOUDINARY_API_KEY_${currentAccountNumber}`];
let API_SECRET = process.env[`CLOUDINARY_API_SECRET_${currentAccountNumber}`];
let API_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/usage`;

// Media limits
const mediaLimits = {
  image_max_size_bytes: 10 * 1024 * 1024, // 10 MB
  video_max_size_bytes: 100 * 1024 * 1024, // 100 MB
  raw_max_size_bytes: 10 * 1024 * 1024, // 10 MB
  image_max_px: 25 * 1000 * 1000, // 25 triệu pixels
  asset_max_total_px: 50 * 1000 * 1000, // 50 triệu pixels
};

// Hàm đọc tài khoản hiện tại từ file
const loadCurrentAccountNumber = async () => {
  try {
    const data = await fs.readFile(accountStateFile, 'utf8');
    const state = JSON.parse(data);
    return state.currentAccountNumber || 1;
  } catch (error) {
    const defaultState = { currentAccountNumber: 1 };
    await fs.writeFile(accountStateFile, JSON.stringify(defaultState, null, 2));
    console.log(
      `Đã tạo file ${accountStateFile} với giá trị mặc định: ${JSON.stringify(
        defaultState
      )}`
    );
    return 1;
  }
};

// Hàm lưu tài khoản hiện tại vào file
const saveCurrentAccountNumber = async (accountNumber) => {
  await fs.writeFile(
    accountStateFile,
    JSON.stringify({ currentAccountNumber: accountNumber }, null, 2)
  );
  console.log(`Đã lưu tài khoản Cloudinary hiện tại: ${accountNumber}`);
};

// Hàm cập nhật cấu hình Cloudinary
const updateCloudinaryConfig = (accountNumber) => {
  CLOUD_NAME = process.env[`CLOUD_NAME_${accountNumber}`];
  API_KEY = process.env[`CLOUDINARY_API_KEY_${accountNumber}`];
  API_SECRET = process.env[`CLOUDINARY_API_SECRET_${accountNumber}`];
  API_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/usage`;

  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });

  console.log(`Đã cập nhật cấu hình Cloudinary cho tài khoản ${accountNumber}`);
};

// Hàm kiểm tra kích thước tệp
const checkFileSize = (file, type) => {
  const fileSizeBytes = file.size;
  const limits = {
    image: mediaLimits.image_max_size_bytes,
    video: mediaLimits.video_max_size_bytes,
    raw: mediaLimits.raw_max_size_bytes,
  };

  const maxSizeBytes = limits[type];
  if (!maxSizeBytes) {
    return {
      isValid: false,
      message: `Loại tài nguyên không hợp lệ: ${type}. Chỉ hỗ trợ 'image', 'video', 'raw'.`,
    };
  }

  if (fileSizeBytes > maxSizeBytes) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024);
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    return {
      isValid: false,
      message: `Kích thước tệp ${fileSizeMB.toFixed(
        2
      )} MB vượt quá giới hạn ${maxSizeMB} MB cho loại ${type}.`,
    };
  }

  return {
    isValid: true,
    message: 'Kích thước tệp hợp lệ.',
  };
};

// Hàm kiểm tra giới hạn pixel của ảnh
const checkImagePixelLimits = async (file) => {
  try {
    const dimensions = imageSize(file.path);
    const width = dimensions.width;
    const height = dimensions.height;

    const imagePixels = width * height;
    const maxImagePixels = mediaLimits.image_max_px;

    console.log(
      `Kiểm tra pixel ảnh: ${imagePixels} pixels (width: ${width}, height: ${height})`
    );

    if (imagePixels > maxImagePixels) {
      return {
        isValid: false,
        message: `Ảnh có ${imagePixels} pixels, vượt quá giới hạn ${maxImagePixels} pixels.`,
      };
    }

    // TODO: Theo dõi tổng pixel (lưu vào database)
    const currentTotalPixels = 0; // Giả sử lấy từ database
    const newTotalPixels = currentTotalPixels + imagePixels;
    const maxTotalPixels = mediaLimits.asset_max_total_px;

    if (newTotalPixels > maxTotalPixels) {
      return {
        isValid: false,
        message: `Tổng số pixel (${newTotalPixels}) vượt quá giới hạn ${maxTotalPixels} pixels.`,
      };
    }

    return {
      isValid: true,
      message: 'Giới hạn pixel của ảnh hợp lệ.',
    };
  } catch (error) {
    console.error('Lỗi khi kiểm tra kích thước ảnh:', error.message);
    return {
      isValid: false,
      message: `Không thể kiểm tra kích thước ảnh: ${error.message}`,
    };
  }
};

// Hàm kiểm tra mức sử dụng Cloudinary
const checkCloudinaryUsage = async () => {
  let retries = 3;
  while (retries > 0) {
    try {
      console.log(
        `Bắt đầu kiểm tra mức sử dụng Cloudinary - Tài khoản ${currentAccountNumber}`
      );
      const response = await axios.get(API_URL, {
        auth: {
          username: API_KEY,
          password: API_SECRET,
        },
        timeout: 5000, // Timeout 5 giây
      });

      const data = response.data;
      const creditsUsed = data.credits.usage;
      let creditsLimit = data.credits.limit;
      const usedPercent = data.credits.used_percent;
      const plan = data.plan;

      if (plan === 'Free') {
        creditsLimit = Math.min(creditsLimit);
      }

      const storageLimitGB = creditsLimit;
      const bandwidthLimitGB = creditsLimit;

      if (usedPercent >= 98) {
        const oldAccountNumber = currentAccountNumber;
        console.log(
          `Tài khoản Cloudinary ${currentAccountNumber} đã đạt ${usedPercent}% (${creditsUsed}/${creditsLimit} credits). Tiến hành chuyển sang tài khoản tiếp theo.`
        );

        currentAccountNumber += 1;
        if (currentAccountNumber <= TOTAL_ACCOUNTS) {
          updateCloudinaryConfig(currentAccountNumber);
          console.log(
            `Đã chuyển sang tài khoản Cloudinary ${currentAccountNumber}.`
          );
          await saveCurrentAccountNumber(currentAccountNumber);
        } else {
          console.log(
            'Tất cả tài khoản Cloudinary đã đạt giới hạn 98%. Upload bị tạm ngưng.'
          );
          currentAccountNumber = TOTAL_ACCOUNTS;
          await saveCurrentAccountNumber(currentAccountNumber);

          // Gửi thông báo báo động khi hết tất cả account
          try {
            await notifyAccountSwitch({
              service: 'Cloudinary',
              fromAccount: `Account ${oldAccountNumber}`,
              toAccount: 'TẤT CẢ ACCOUNT ĐÃ HẾT',
              reason: `Tất cả ${TOTAL_ACCOUNTS} account đã đạt giới hạn 98%`,
              usage: [
                {
                  label: 'Trạng thái',
                  value: 'CẤP THIẾT - TẤT CẢ ACCOUNT ĐÃ HẾT',
                },
                {
                  label: 'Account cuối cùng',
                  value: `Account ${oldAccountNumber} - ${usedPercent}%`,
                },
              ],
              limits: [
                {
                  label: 'Hành động cần thiết',
                  value: 'Nâng cấp gói hoặc xóa file cũ',
                },
                { label: 'Upload status', value: 'BỊ TẠM NGƯNG' },
              ],
            });
          } catch (notificationError) {
            console.error(
              `❌ Lỗi gửi thông báo hết account Cloudinary: ${notificationError.message}`
            );
          }

          throw new Error(
            'Tất cả tài khoản Cloudinary đã đạt giới hạn 98%. Upload bị tạm ngưng.'
          );
        }
      }

      if (usedPercent >= 90 && usedPercent < 95) {
        console.log(
          `Tài khoản Cloudinary ${currentAccountNumber}: Bạn đã sử dụng ${usedPercent}% giới hạn miễn phí (${creditsUsed}/${creditsLimit} credits). Vui lòng xem xét giảm upload hoặc nâng cấp gói.`
        );
      }
      if (usedPercent >= 95 && usedPercent < 98) {
        console.log(
          `Tài khoản Cloudinary ${currentAccountNumber}: Bạn đã sử dụng ${usedPercent}% giới hạn miễn phí (${creditsUsed}/${creditsLimit} credits). Upload sẽ sớm bị ngưng nếu không giảm tài nguyên.`
        );
      }

      const bandwidthUsageGB = data.bandwidth.usage / (1024 * 1024 * 1024);
      const bandwidthUsedPercent = (bandwidthUsageGB / bandwidthLimitGB) * 100;

      if (bandwidthUsedPercent >= 90 && bandwidthUsedPercent < 95) {
        console.log(
          `Tài khoản Cloudinary ${currentAccountNumber}: Băng thông đã đạt ${bandwidthUsedPercent.toFixed(
            2
          )}% (${bandwidthUsageGB.toFixed(
            2
          )}/${bandwidthLimitGB} GB). Vui lòng giảm truy cập tài nguyên.`
        );
      }
      if (bandwidthUsedPercent >= 95) {
        console.log(
          `Tài khoản Cloudinary ${currentAccountNumber}: Băng thông đã đạt ${bandwidthUsedPercent.toFixed(
            2
          )}% (${bandwidthUsageGB.toFixed(
            2
          )}/${bandwidthLimitGB} GB). Hạn chế truy cập tài nguyên để tránh vượt giới hạn.`
        );
      }

      const storageUsageGB = data.storage.usage / (1024 * 1024 * 1024);
      const storageUsedPercent = (storageUsageGB / storageLimitGB) * 100;

      if (storageUsedPercent >= 90 && storageUsedPercent < 95) {
        console.log(
          `Tài khoản Cloudinary ${currentAccountNumber}: Dung lượng lưu trữ đã đạt ${storageUsedPercent.toFixed(
            2
          )}% (${storageUsageGB.toFixed(
            2
          )}/${storageLimitGB} GB). Vui lòng xem xét giảm tài nguyên.`
        );
      }
      if (storageUsedPercent >= 95) {
        console.log(
          `Tài khoản Cloudinary ${currentAccountNumber}: Dung lượng lưu trữ đã đạt ${storageUsedPercent.toFixed(
            2
          )}% (${storageUsageGB.toFixed(
            2
          )}/${storageLimitGB} GB). Upload sẽ sớm bị ngưng nếu không giảm tài nguyên.`
        );
      }

      console.log(
        `Kiểm tra Cloudinary (Tài khoản ${currentAccountNumber}): Credits ${creditsUsed}/${creditsLimit} (${usedPercent.toFixed(
          2
        )}%), Storage ${storageUsageGB.toFixed(
          2
        )}/${storageLimitGB} GB (${storageUsedPercent.toFixed(
          2
        )}%), Bandwidth ${bandwidthUsageGB.toFixed(
          2
        )}/${bandwidthLimitGB} GB (${bandwidthUsedPercent.toFixed(2)}%)`
      );
      return;
    } catch (error) {
      retries -= 1;
      console.error(
        `Lỗi khi kiểm tra mức sử dụng Cloudinary (Thử lại ${retries}): ${error.message}`
      );
      if (retries === 0) {
        throw new Error(
          'Không thể kiểm tra mức sử dụng Cloudinary sau nhiều lần thử lại.'
        );
      }
      // Đợi 1 giây trước khi thử lại
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

// Hàm lấy tài khoản hiện tại
const getCurrentAccountNumber = () => currentAccountNumber;

// Khởi động: Tải tài khoản hiện tại và cấu hình
const initializeCloudinary = async () => {
  currentAccountNumber = await loadCurrentAccountNumber();
  updateCloudinaryConfig(currentAccountNumber);
  console.log(`Khởi động với tài khoản Cloudinary ${currentAccountNumber}`);
  await checkCloudinaryUsage();
};

// Hàm upload tệp lên Cloudinary
const uploadFile = async (file, type = 'image', options = {}) => {
  try {
    if (!file || !file.path) {
      throw new Error('Không có tệp được cung cấp để upload.');
    }

    console.log(`Bắt đầu upload file ${file.filename} (type: ${type})`);

    // Kiểm tra mức sử dụng Cloudinary
    await checkCloudinaryUsage();
    console.log(
      `Đang sử dụng tài khoản Cloudinary ${getCurrentAccountNumber()}`
    );

    // Kiểm tra kích thước tệp
    const sizeCheck = checkFileSize(file, type);
    if (!sizeCheck.isValid) {
      throw new Error(sizeCheck.message);
    }

    // Kiểm tra giới hạn pixel nếu là ảnh
    // if (type === 'image') {
    //   const pixelCheck = await checkImagePixelLimits(file);
    //   if (!pixelCheck.isValid) {
    //     throw new Error(pixelCheck.message);
    //   }
    // }

    // Upload lên Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      resource_type: type,
      ...options,
    });

    // Log để kiểm tra
    console.log('Upload result:', {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      folder: uploadResult.folder || 'root',
    });

    // Xóa tệp tạm
    await fs
      .unlink(file.path)
      .catch((err) => console.error('Lỗi xóa file tạm:', err));

    return {
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      message: 'Upload thành công.',
    };
  } catch (error) {
    // Xóa tệp tạm nếu upload thất bại
    if (file && file.path) {
      await fs
        .unlink(file.path)
        .catch((err) => console.error('Lỗi xóa file tạm:', err));
    }
    console.error(
      `Lỗi khi upload tệp ${file?.filename || 'unknown'}: ${error.message}`
    );
    throw new Error(`Lỗi khi upload tệp: ${error.message}`);
  }
};

// Xuất các hàm để tái sử dụng
module.exports = {
  checkFileSize,
  checkImagePixelLimits,
  checkCloudinaryUsage,
  getCurrentAccountNumber,
  initializeCloudinary,
  cloudinary,
  uploadFile,
};
