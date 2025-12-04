import mongoose from "mongoose";

const DomainSchema = new mongoose.Schema({
  userId: String,
  domain: String,
  createdAt: Number,
  expiresAt: Number
});

export default mongoose.models.Domain ||
  mongoose.model("Domain", DomainSchema);
