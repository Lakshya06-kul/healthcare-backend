const Doctor = require("../models/doctor");
const User = require("../models/user");

exports.listDoctors = async (_req, res) => {
  try {
    const doctors = await Doctor.find().populate({
      path: "userId",
      select: "name email role isVerified verificationStatus"
    });

    const formattedDoctors = doctors
      .filter((doctor) => doctor.userId && doctor.userId.role === "doctor")
      .map((doctor) => ({
        _id: doctor._id,
        userId: doctor.userId._id,
        name: doctor.userId.name,
        email: doctor.userId.email,
        isVerified: doctor.userId.isVerified,
        verificationStatus: doctor.userId.verificationStatus,
        specialization: doctor.specialization,
        price: doctor.price,
        availability: doctor.availability,
        isOnline: doctor.isOnline
      }))
      .filter((doctor) => doctor.isVerified);

    return res.json({ doctors: formattedDoctors });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.createDoctorProfile = async (req, res) => {
  try {
    const { specialization, price } = req.body;
    const userId = req.user.userId;

    if (!specialization || price === undefined) {
      return res.status(400).json({ msg: "Specialization and price are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.role !== "doctor") {
      return res.status(403).json({ msg: "Only users with doctor role can create profile" });
    }

    const existingDoctor = await Doctor.findOne({ userId });
    if (existingDoctor) {
      return res.status(400).json({ msg: "Doctor profile already exists" });
    }

    const doctor = await Doctor.create({
      userId,
      specialization,
      price
    });

    return res.status(201).json(doctor);
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.setAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ msg: "Availability must be an array" });
    }

    for (const item of availability) {
      if (!item.date || !Array.isArray(item.slots)) {
        return res.status(400).json({ msg: "Each availability item must include date and slots[]" });
      }
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor profile not found" });
    }

    doctor.availability = availability;
    await doctor.save();

    return res.json({ msg: "Availability updated", availability: doctor.availability });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.toggleOnlineStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
      return res.status(404).json({ msg: "Doctor profile not found" });
    }

    doctor.isOnline = !doctor.isOnline;
    await doctor.save();

    return res.json({ msg: "Online status updated", isOnline: doctor.isOnline });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};