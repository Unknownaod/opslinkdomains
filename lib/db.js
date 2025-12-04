import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  const uri = process.env.MONGODB_URI;

  if (!uri) throw new Error("❌ Missing MONGODB_URI environment variable");

  await mongoose.connect(uri, {
    dbName: "opslink-domains"
  });

  console.log("🟢 MongoDB connected");
}
