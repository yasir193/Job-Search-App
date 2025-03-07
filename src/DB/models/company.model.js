import mongoose from "mongoose";

const companySchema = mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    numberOfEmployees: {
      type: String,
      required: true,
    },
    companyEmail: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    legalAttachment: {
      secure_url: String,
      public_id: String,
    },
    deletedAt: {
      type: Date,
      default: null, 
    },
  },
  { timestamps: true }
);


companySchema.virtual("jobs", {
  ref: "JobOpportunity",
  localField: "_id",
  foreignField: "companyId",
});

companySchema.set("toJSON", { virtuals: true });
companySchema.set("toObject", { virtuals: true });

export const Company = mongoose.models.Company || mongoose.model("Company", companySchema);