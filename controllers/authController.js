const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, doctorInfo } = req.body;

    console.log('Registration attempt:', { name, email, role, passwordLength: password?.length, doctorInfo });

    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!["doctor", "patient"].includes(role)) {
      return res.status(400).json({ msg: "Role must be doctor or patient" });
    }

    // Additional validation for doctors
    if (role === "doctor") {
      if (!doctorInfo) {
        return res.status(400).json({ msg: "Doctor information is required" });
      }
      const { licenseNumber, specialization, experience, hospital, graduationYear } = doctorInfo;
      if (!licenseNumber || !specialization || !experience || !hospital || !graduationYear) {
        return res.status(400).json({ msg: "All doctor fields are required" });
      }
      if (experience < 0 || graduationYear < 1950 || graduationYear > new Date().getFullYear()) {
        return res.status(400).json({ msg: "Invalid experience or graduation year" });
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    console.log('Creating user...');
    const userData = {
      name,
      email,
      password,
      role
    };

    // Add doctor-specific data
    if (role === "doctor") {
      userData.doctorInfo = doctorInfo;
      userData.verificationStatus = "pending";
      userData.isVerified = false;
    }

    const user = await User.create(userData);

    // Simulate document verification for demo purposes
    if (role === "doctor" && doctorInfo.documents) {
      // In a real app, this would involve actual document verification
      // For demo, we'll auto-verify if documents are provided
      user.doctorInfo.documents = doctorInfo.documents.map(doc => ({
        ...doc,
        verified: true // Auto-verify for demo
      }));
      user.verificationStatus = "verified";
      user.isVerified = true;
      user.verifiedAt = new Date();
      user.verificationNotes = "Auto-verified for demo purposes";
      await user.save();
    }

    console.log('User created successfully:', user._id);
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      verificationStatus: user.verificationStatus
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Check if doctor is verified
    if (user.role === "doctor" && !user.isVerified) {
      return res.status(403).json({ 
        msg: "Your doctor account is pending verification. Please wait for admin approval." 
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus
      }
    });
  } catch (error) {
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

