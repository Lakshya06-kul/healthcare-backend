const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    
    try {
      console.log("Trying to connect to MongoDB Atlas...");
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log("MongoDB Connected to Cloud/Local");
    } catch (e) {
      console.log("Cloud MongoDB failed, starting Local In-Memory Database...");
      process.env.MONGOMS_DOWNLOAD_DIR = "E:\\mongodb-binaries";
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log("MongoDB Connected (In-Memory Fallback Active!)");
    }
  } catch (error) {
    console.error("DB ERROR:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;