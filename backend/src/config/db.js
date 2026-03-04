import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URL || "mongodb://localhost:27017/scc");
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

export default connectDB;
