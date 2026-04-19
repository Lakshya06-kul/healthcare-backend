const Appointment = require("../models/appointment");
const Message = require("../models/message");

exports.saveMessage = async (req, res) => {
  try {
    const { appointmentId, text } = req.body;
    const senderId = req.user.userId;

    if (!appointmentId || !text) {
      return res.status(400).json({ msg: "appointmentId and text are required" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    const message = await Message.create({
      appointmentId,
      senderId,
      text
    });

    const payload = {
      _id: message._id,
      appointmentId: message.appointmentId,
      senderId: message.senderId,
      text: message.text,
      createdAt: message.createdAt
    };

    const io = req.app.get("io");
    if (io) {
      io.to(String(appointmentId)).emit("receiveMessage", payload);
    }

    return res.status(201).json({
      msg: "Message sent successfully",
      message: payload
    });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};