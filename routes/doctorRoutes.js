const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createDoctorProfile,
  setAvailability,
  toggleOnlineStatus
} = require("../controllers/doctorController");

router.post("/profile", authMiddleware, createDoctorProfile);
router.post("/availability", authMiddleware, setAvailability);
router.put("/toggle", authMiddleware, toggleOnlineStatus);

module.exports = router;