const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    slots: [{ type: String, required: true }]
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    specialization: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    availability: { type: [availabilitySchema], default: [] },
    isOnline: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);