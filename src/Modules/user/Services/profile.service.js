import { Decryption, Encryption } from "./../../../utils/crypto.utils.js";
import jwt from "jsonwebtoken";
import { User } from "../../../DB/models/index.js";
import { compareSync, hashSync } from "bcrypt";
import { BlacklistToken } from "../../../DB/models/black-list-tokens.model.js";

export const getProfile = async (req, res) => {
  try {
    const { accesstoken } = req.headers;

    // Verify the access token
    const decodedData = jwt.verify(accesstoken, process.env.JWT_SECRET);

    // Find the user by ID
    const user = await User.findById(decodedData._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Decrypt the phone field
    if (user.phone) {
      const decryptedPhone = await Decryption({
        value: user.phone,
        secret: process.env.ENCRYPTION_SECRET_KEY,
      });
      user.phone = decryptedPhone;
    }

    // Respond with the user data (excluding sensitive fields like password)
    const userData = user.toObject();
    userData.username = user.username;
    delete userData.password;
    delete userData.confirmOtp;

    res.status(200).json({ user: userData });
  } catch (error) {
    console.log("Error in getProfile:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const updateUserAccount = async (req, res) => {
  try {
    const { accesstoken } = req.headers;
    const decodedData = jwt.verify(accesstoken, process.env.JWT_SECRET);

    // Find the user by ID
    const user = await User.findById(decodedData._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { phone, DOB, firstName, lastName, gender } = req.body; // Fields to update

    // Update the fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (DOB) user.DOB = DOB;
    if (gender) user.gender = gender;

    // Encrypt the phone if it is being updated
    if (phone) {
      const encryptedPhone = await Encryption({
        value: phone,
        secret: process.env.ENCRYPTION_SECRET_KEY,
      });
      user.phone = encryptedPhone;
    }

    // Save the updated user
    await user.save();

    // Respond with the updated user (excluding sensitive data like password)
    const userData = user.toObject();
    delete userData.password;
    delete userData.confirmOtp;

    res
      .status(200)
      .json({ message: "User updated successfully", user: userData });
  } catch (error) {
    console.log("Error in updateUserAccount:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const updatePasswordService = async (req, res) => {
  try {
    const { _id } = req.loggedInUser; // Get the logged-in user's ID
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    // Check if all fields are provided
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Find the user by ID
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure user has a password before comparing
    if (!user.password) {
      return res.status(400).json({ message: "User has no password set" });
    }

    // Check if the old password is correct
    const isPasswordMatched = compareSync(oldPassword, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Hash the new password
    const hashedPassword = hashSync(newPassword, +process.env.SALT);

    // Update only the password field
    user.password = hashedPassword;
    await user.save();

    // Revoke user token
    await BlacklistToken.create(req.loggedInUser.token);

    // Respond with success message
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in updatePasswordService:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const softDeleteAccount = async (req, res) => {
  try {
    if (!req.loggedInUser || !req.loggedInUser._id) {
      return res.status(401).json({ message: "Unauthorized. Please login." });
    }

    const { _id } = req.loggedInUser;
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.deletedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error in softDeleteAccount:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const assignAdminRole = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user to assign the admin role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is already an admin
    if (user.role === "admin") {
      return res.status(400).json({ message: "User is already an admin" });
    }

    // Assign the admin role
    user.role = "admin";
    await user.save();

    // Return the updated user (excluding sensitive data)
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({ message: "User role updated to admin successfully", user: userData });
  } catch (error) {
    console.log("Error in assignAdminRole:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


export const banUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is already banned
    if (user.bannedAt) {
      return res.status(400).json({ message: "User is already banned" });
    }

    // Ban the user by setting the bannedAt field
    user.bannedAt = new Date();
    await user.save();

    res.status(200).json({ message: "User banned successfully", user });
  } catch (error) {
    console.log("Error in banUser:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};