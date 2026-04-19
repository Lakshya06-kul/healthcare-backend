const Appointment = require("../models/appointment");
const Doctor = require("../models/doctor");
const User = require("../models/user");

exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time } = req.body;
    const patientId = req.user.userId;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ msg: "doctorId, date, and time are required" });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ msg: "Patient not found" });
    }

    if (patient.role !== "patient") {
      return res.status(403).json({ msg: "Only patients can book appointments" });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor not found" });
    }

    const isBooked = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $ne: "cancelled" }
    });

    if (isBooked) {
      return res.status(400).json({ msg: "Slot already booked" });
    }

    // Atomic slot removal prevents two parallel requests from booking the same slot.
    const updatedDoctor = await Doctor.findOneAndUpdate(
      {
        _id: doctorId,
        availability: { $elemMatch: { date, slots: time } }
      },
      {
        $pull: { "availability.$.slots": time }
      },
      { new: true }
    );

    if (!updatedDoctor) {
      return res.status(400).json({ msg: "Selected slot is not available" });
    }

    await Doctor.updateOne(
      { _id: doctorId },
      { $pull: { availability: { date, slots: { $size: 0 } } } }
    );

    const appointment = await Appointment.create({
      doctorId,
      patientId,
      date,
      time,
      status: "booked",
      channelName: "pending"
    });

    appointment.channelName = `appointment_${appointment._id}`;
    await appointment.save();

    const remainingSlots =
      updatedDoctor.availability.find((entry) => entry.date === date)?.slots || [];

    const io = req.app.get("io");
    if (io) {
      io.emit("slotBooked", {
        appointmentId: appointment._id,
        doctorId,
        patientId,
        date,
        time,
        channelName: appointment.channelName
      });

      io.emit("slotUpdated", {
        doctorId,
        date,
        availableSlots: remainingSlots
      });
    }

    return res.status(201).json({
      msg: "Appointment booked successfully",
      appointment
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(400).json({ msg: "Slot already booked" });
    }

    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};
