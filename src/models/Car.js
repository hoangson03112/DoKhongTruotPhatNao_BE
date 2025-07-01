const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  licensePlate: { type: String, required: true, unique: true },
  seats: { type: Number, required: true },
  description: { type: String },
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema); 