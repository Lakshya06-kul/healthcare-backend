require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const authRoutes = require("./routes/authRoutes.js");
const doctorRoutes = require("./routes/doctorRoutes.js");
const appointmentRoutes = require("./routes/appointmentRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");
const registerSocketHandlers = require("./sockets/socketHandler.js");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

connectDB();
registerSocketHandlers(io);
app.set("io", io);

// ✅ CORS (VERY IMPORTANT)
app.use(cors({
  origin: true, // Reflects the exact origin of the request, bypassing strict CORS mismatch errors
  credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Running");
});

app.use("/api/auth", authRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/messages", messageRoutes);

// ✅ PORT FIX (REQUIRED FOR RENDER)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
