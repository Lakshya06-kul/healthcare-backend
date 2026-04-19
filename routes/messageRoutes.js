const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { saveMessage } = require("../controllers/messageController");

router.post("/", authMiddleware, saveMessage);

module.exports = router;