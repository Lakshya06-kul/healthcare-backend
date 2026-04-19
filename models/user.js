const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["doctor", "patient"], required: true },
  // Doctor verification fields
  isVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  doctorInfo: {
    licenseNumber: { type: String },
    specialization: { type: String },
    experience: { type: Number },
    hospital: { type: String },
    graduationYear: { type: Number },
    documents: [{
      type: { type: String }, // 'license', 'degree', 'certificate'
      filename: { type: String },
      url: { type: String },
      verified: { type: Boolean, default: false }
    }]
  },
  verificationNotes: { type: String },
  verifiedAt: { type: Date }
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw error;
  }
});

module.exports = mongoose.model("User", userSchema);
