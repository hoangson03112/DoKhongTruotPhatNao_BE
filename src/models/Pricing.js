const mongoose = require("mongoose");

const PricingSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['per_entry', 'hourly', 'daily', 'monthly'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'motorbike'],
      required: true,
    },
    maxDuration: {
      type: Number, 
      default: null,
    },
  });
const Pricing = mongoose.model("Pricing", PricingSchema, "pricing");
module.exports = Pricing;
