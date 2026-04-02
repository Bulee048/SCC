import mongoose from "mongoose";

/** "remote" = real MONGO_URI (Atlas cluster only) */
export let dbConnectionMode = "none";

const toSafeMongoUriForLogs = (mongoUri) => {
  if (!mongoUri) return "";
  try {
    const u = new URL(mongoUri);
    // Keep only protocol + host + path; drop credentials and query.
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    // Fallback: redact credentials if present.
    return mongoUri.replace(/\/\/[^@]+@/i, "//***:***@");
  }
};

/**
 * Connect to MongoDB Atlas cluster only. No local/in-memory database fallback.
 */
const connectDB = async () => {
  let mongoUri = (process.env.MONGO_URI || process.env.MONGODB_URI || "").trim();

  if (!mongoUri) {
    throw new Error("MongoDB URI is missing. Set MONGO_URI or MONGODB_URI in your environment.");
  }

  // Common .env mistake: MONGO_URI=MONGO_URI=mongodb+srv://...
  if (mongoUri.startsWith("MONGO_URI=")) {
    mongoUri = mongoUri.slice("MONGO_URI=".length).trim();
  }
  if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
    throw new Error(
      "MONGO_URI must start with mongodb:// or mongodb+srv://. Check backend/.env for a typo (e.g. duplicate MONGO_URI=)."
    );
  }

  const connect = async (uri) => {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout instead of hanging
      connectTimeoutMS: 10000,
    });
    return conn;
  };

  try {
    const conn = await connect(mongoUri);
    dbConnectionMode = "remote";
    console.log(`MongoDB Connected (persistent): ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü");
    console.error("  MongoDB Atlas Connection FAILED");
    console.error("ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü");
    console.error("  Error:", error.message);
    console.error("  Fix checklist:");
    console.error("  1. Go to MongoDB Atlas ΓåÆ Network Access");
    console.error("     Add your current IP address (or 0.0.0.0/0 for dev)");
    console.error("  2. Check your MONGO_URI credentials in backend/.env");
    console.error("     Current URI (redacted):", toSafeMongoUriForLogs(mongoUri));
    console.error("  3. Ensure your MongoDB cluster is active and running");
    console.error("ΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöüΓöü");
    throw new Error(`MongoDB Atlas connection failed: ${error.message}`);
  }
};

export default connectDB;
