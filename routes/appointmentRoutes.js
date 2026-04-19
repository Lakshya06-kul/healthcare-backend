const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { bookAppointment } = require("../controllers/appointmentController");

router.post("/book", authMiddleware, bookAppointment);

module.exports = router;