import mongoose from "mongoose";

const PendingDomainSchema = new mongoose.Schema({
  userId: String,
  domains: [String],
  createdAt: Number
});

export default mongoose.models.PendingDomain ||
  mongoose.model("PendingDomain", PendingDomainSchema);
