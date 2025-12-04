// /models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  domains: [{ type: String }] // domain list for dashboard
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
