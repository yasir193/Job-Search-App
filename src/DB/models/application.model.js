import mongoose from "mongoose";

const applicationSchema = mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOpportunity",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userCV: {
      secure_url: String,
      public_id: String,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "viewed", "in consideration", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);