const cron = require('node-cron');
const axios = require('axios');

const keepServerAlive = async () => {
  try {
    const response = await axios.get(
      'https://do-khong-truot-phat-nao.onrender.com'
    );

    // Lấy thời gian hiện tại để log
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    console.log(
      `[${formattedHours}:${formattedMinutes} ${ampm}] Cronjob "Keep Server Alive": Request sent successfully, Status: ${response.status}`
    );
  } catch (error) {
    // Lấy thời gian hiện tại để log
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    console.error(
      `[${formattedHours}:${formattedMinutes} ${ampm}] Cronjob "Keep Server Alive": Error sending request: ${error.message}`
    );
  }
};

// Lên lịch cronjob chạy vào các phút 00, 15, 30, 45 trong các khung giờ 7-12, 13-15, 18-23
cron.schedule(
  '0,15,30,45 * * * *',
  () => {
    console.log('Cronjob: Keep server alive at every 15 minutes');
    keepServerAlive();
  },
  {
    timezone: 'Asia/Ho_Chi_Minh',
  }
);
