// /lib/db.js
import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  if (!process.env.MONGO_URI) {
    throw new Error("❌ Missing MONGO_URI env variable");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("📡 MongoDB connected");
  } catch (err) {
    console.error("MongoDB Error:", err);
  }
}
