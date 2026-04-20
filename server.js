require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const User = require("./models/user");
const Doctor = require("./models/doctor");
const connectDB = require("./config/db.js");
const authRoutes = require("./routes/authRoutes.js");
const doctorRoutes = require("./routes/doctorRoutes.js");
const appointmentRoutes = require("./routes/appointmentRoutes.js");
const messageRoutes = require("./routes/messageRoutes.js");
const registerSocketHandlers = require("./sockets/socketHandler.js");

dotenv.config();

const app = express();
const server = http.createServer(app);
const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || "*";

const formatDate = (date) => date.toISOString().slice(0, 10);

const buildDemoAvailability = () => {
  const today = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return [
    { date: formatDate(today), slots: ["10:00", "11:00", "12:00"] },
    { date: formatDate(tomorrow), slots: ["09:00", "10:30", "14:00"] }
  ];
};

const seedDemoDoctors = async () => {
  const demoDoctors = [
    {
      name: "Dr. Hamza",
      email: "hamza.doctor@example.com",
      password: "DemoDoctor123!",
      specialization: "Cardiology",
      price: 1200,
      isOnline: true
    },
    {
      name: "Dr. Areeba",
      email: "areeba.doctor@example.com",
      password: "DemoDoctor123!",
      specialization: "Dermatology",
      price: 1500,
      isOnline: false
    }
  ];

  for (const doctorSeed of demoDoctors) {
    let user = await User.findOne({ email: doctorSeed.email });

    if (!user) {
      user = await User.create({
        name: doctorSeed.name,
        email: doctorSeed.email,
        password: doctorSeed.password,
        role: "doctor",
        isVerified: true,
        verificationStatus: "verified",
        doctorInfo: {
          specialization: doctorSeed.specialization
        }
      });
    }

    let doctorProfile = await Doctor.findOne({ userId: user._id });

    if (!doctorProfile) {
      await Doctor.create({
        userId: user._id,
        specialization: doctorSeed.specialization,
        price: doctorSeed.price,
        availability: buildDemoAvailability(),
        isOnline: doctorSeed.isOnline
      });
      continue;
    }

    if (!doctorProfile.availability || doctorProfile.availability.length === 0) {
      doctorProfile.availability = buildDemoAvailability();
    }

    doctorProfile.specialization = doctorSeed.specialization;
    doctorProfile.price = doctorSeed.price;
    doctorProfile.isOnline = doctorSeed.isOnline;
    await doctorProfile.save();
  }
};

const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const startServer = async () => {
  await connectDB();
  await seedDemoDoctors();

  registerSocketHandlers(io);
  app.set("io", io);

  // ✅ CORS (VERY IMPORTANT)
  app.use(cors({
    origin: frontendUrl === "*" ? true : frontendUrl,
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
};

startServer().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
