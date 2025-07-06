//implementations đơn giản và chỉ hoạt động trên một server.
// Trong môi trường production/multi-server, có thể phải sử dụng một hệ thống queue phân tán
// như Redis Lists (với BullMQ/ioredis), RabbitMQ, Kafka, SQS, v.v.

// In a real multi-server environment, use a distributed queue like Redis, RabbitMQ, Kafka.
// This is a basic in-memory queue for demonstration on a single server.
const ParkingLot = require('../models/ParkingLot');
// const ParkingSpot = require('../models/ParkingSpot');
const { default: mongoose } = require('mongoose');

class QueueService {
  constructor() {
    if (!QueueService.instance) {
      // Kiểm tra instance của Queue đã tồn tại trong ứng dụng chưa
      this.queue = [];
      this.isProcessing = false;
      // Start processing queue every X milliseconds
      setInterval(this.processQueue.bind(this), 5000); // Process every 5 seconds
      QueueService.instance = this;
    }
    return QueueService.instance; //Luôn trả về instance duy nhất
  }

  // Add a job to the queue
  addJob(jobType, payload) {
    this.queue.push({ jobType, payload, timestamp: Date.now() });
    console.log(
      `Job added to queue: ${jobType}, Queue size: ${this.queue.length}`
    );
  }

  // Process jobs from the queue
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const jobsToProcess = this.queue.splice(0, 10); // Process up to 10 jobs at a time (batching)

    for (const job of jobsToProcess) {
      try {
        console.log(`Processing job: ${job.jobType} for payload:`, job.payload);
        if (job.jobType === 'decrementAvailableSpots') {
          await this.handleDecrementAvailableSpots(job.payload);
        } else if (job.jobType === 'incrementAvailableSpots') {
          await this.handleIncrementAvailableSpots(job.payload);
        }
        // Add other job types here (e.g., send_notification, update_payment_status)
      } catch (error) {
        console.error(`Error processing job ${job.jobType}:`, error.message);
        // Implement retry logic or dead-letter queue for failed jobs in production
      }
    }
    this.isProcessing = false;
  }

  // Khi một booking mới được tạo, có thể là đặt trước (reserved) hoặc đặt ngay (occupied)
  // async handleDecrementAvailableSpots(payload) {
  //   const { parkingLotId, parkingSpotId, newParkingSpotStatus } = payload;
  //   const session = await mongoose.startSession();
  //   session.startTransaction();
  //   try {
  //     // 1. Cập nhật trạng thái ParkingSpot, sử dụng newParkingSpotStatus từ payload: occupied hoaặc reserved
  //     await ParkingSpot.findByIdAndUpdate(
  //       parkingSpotId,
  //       { status: newParkingSpotStatus },
  //       { session }
  //     );

  //     // 2. Giảm availableSpots của ParkingLot
  //     const updatedLot = await ParkingLot.findByIdAndUpdate(
  //       parkingLotId,
  //       { $inc: { availableSpots: -1 } },
  //       { new: true, session }
  //     );

  //     if (updatedLot && updatedLot.availableSpots < 0) {
  //       throw new Error(
  //         'Not enough available spots. Rolling back transaction.'
  //       );
  //     }

  //     await session.commitTransaction();
  //     console.log(
  //       `Decremented available spots for ${parkingLotId}. New count: ${updatedLot.availableSpots}`
  //     );

  //     // TODO: Gửi cập nhật real-time về frontend qua Socket
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error; // Re-throw to be caught by processQueue error handling
  //   } finally {
  //     session.endSession();
  //   }
  // }

  // // Khi một booking bị huỷ hoặc xe check-out, đánh dấu chỗ đó là 'available'
  // async handleIncrementAvailableSpots(payload) {
  //   const { parkingLotId, parkingSpotId, newParkingSpotStatus } = payload;
  //   const session = await mongoose.startSession();
  //   session.startTransaction();
  //   try {
  //     // 1. Cập nhật trạng thái ParkingSpot
  //     await ParkingSpot.findByIdAndUpdate(
  //       parkingSpotId,
  //       { status: newParkingSpotStatus },
  //       { session }
  //     );

  //     // 2. Tăng availableSpots của ParkingLot
  //     const updatedLot = await ParkingLot.findByIdAndUpdate(
  //       parkingLotId,
  //       { $inc: { availableSpots: 1 } },
  //       { new: true, session }
  //     );

  //     await session.commitTransaction();
  //     console.log(
  //       `Incremented available spots for ${parkingLotId}. New count: ${updatedLot.availableSpots}`
  //     );

  //     // TODO: Gửi cập nhật real-time về frontend qua Socket
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }
}

const queueService = new QueueService(); //Tạo instance đầu tiên

module.exports = queueService;
