import mongoose from "mongoose";
import { ProvidersEnum } from "./../../constants/constants.js";
import { Decryption, Encryption } from "../../utils/crypto.utils.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      default: ProvidersEnum.SYSTEM,
      enum: Object.values(ProvidersEnum),
    },
    changeCredentialTime: {
      type: Date,
    },
    phone: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    dateOfBirth: {
      type: Date,
    },
    role: {
      type: String,
      default: "user",
      enum: ["admin", "user"],
    },
    profilePic: {
      type: [String],
    },
    confirmOtp: String,
    coverPic: {
      type: [String],
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    resetPasswordOtp: String,
    resetPasswordOtpExpiry: Date,
  },
  { timestamps: true }
);

// ✅ Virtual field for username
userSchema.virtual("username").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre("save", async function (next) {
  if (this.isModified("phone")) {
    this.phone = await Encryption({
      value: this.phone,
      secret: process.env.ENCRYPTION_SECRET_KEY,
    });
  }
  next();
});

userSchema.post("find", async function (docs) {
  for (const doc of docs) {
    if (doc.phone && doc.phone.startsWith("ENC_")) {
      doc.phone = await Decryption({
        value: doc.phone,
        secret: process.env.ENCRYPTION_SECRET_KEY,
      });
    }
  }
});

userSchema.post("findOne", async function (doc) {
  if (doc && doc.phone && doc.phone.startsWith("ENC_")) {
    doc.phone = await Decryption({
      value: doc.phone,
      secret: process.env.ENCRYPTION_SECRET_KEY,
    });
  }
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
