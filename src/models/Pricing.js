const mongoose = require("mongoose");

const PricingSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["hourly"],
    default: "hourly",
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});
const Pricing = mongoose.model("Pricing", PricingSchema, "pricing");
module.exports = Pricing;
