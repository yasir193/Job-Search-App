import { compareSync, hashSync } from "bcrypt";
import { User } from "../../../DB/models/index.js"
import { emitter } from "../../../Services/send-email.service.js";
import { Encryption } from "./../../../utils/crypto.utils.js";
import { v4 as uuidv4 } from "uuid";
import { ProvidersEnum } from "../../../constants/constants.js";
import { generateToken } from "../../../utils/tokens.utils.js";
import { OAuth2Client } from "google-auth-library";
export const signUpService = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      password,
      confirmPassword,
      phone,
      gender,
      dateOfBirth,
      email,
    } = req.body;
    const isEmailExists = await User.findOne({ email });
    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ message: "password and confirm password does not match" });
    if (isEmailExists)
      return res.status(409).json({ message: "Email already exists" });
    // hash password
    const hashedPassword = hashSync(password, +process.env.SALT);
    // encrypt phone
    const encryptedPhone = await Encryption({
      value: phone,
      secret: process.env.ENCRYPTION_SECRET_KEY,
    });

    // confirm

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = hashSync(otp, +process.env.SALT);

    // const confirmEmailLink = `${req.protocol}://${req.headers.host}/auth/verify/${token}`;

    emitter.emit("sendEmail", {
      to: email,
      subject: "verify your email",
      html: `<h1>Verify your email</h1>
        <h2>${otp}</h2>
        `,
    });

    const user = await User.create({
      firstName: firstName,
      lastName: lastName,
      password: hashedPassword,
      phone: encryptedPhone,
      gender,
      email: email,
      dateOfBirth,
      confirmOtp: hashedOtp,
    });
    if (!user)
      return res
        .status(500)
        .json({ message: "Creation failed, please try again later" });
    const userWithUsername = user.toObject(); // Convert Mongoose document to a plain object
    userWithUsername.username = user.username; // Add the virtual field

    res
      .status(201)
      .json({ message: "User created successfully!", user: userWithUsername });
  } catch (error) {
    console.log("catch error from signUpService", error);
    res.status(500).json({ message: "internal server error", error });
  }
};
// ------------------------------------------------------------------
export const ConfirmEmailService = async (req, res, next) => {
  const { email, otp } = req.body;

  // check email if exists
  const user = await User.findOne({
    email,
    isConfirmed: false,
    confirmOtp: { $exists: true },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // check otp
  const isOtpValid = compareSync(otp, user.confirmOtp);
  if (!isOtpValid) {
    return res.status(400).json({ message: "Invalid otp" });
  }

  // update user
  await User.updateOne(
    { _id: user._id },
    { isConfirmed: true, $unset: { confirmOtp: "" } }
  );

  return res.status(200).json({ message: "Email confirmed successfully" });
};
// ------------------------------------------------------------------
export const signInService = async (req, res, next) => {
  const { email, password } = req.body;

  // check email if exists
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // check password
  const isPasswordValid = compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid password" });
  }

  // generate tokens
  const accesstoken = generateToken({
    publicClaims: { _id: user._id },
    registeredClaims: {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
      jwtid: uuidv4(),
    },
    secretKey: process.env.JWT_SECRET,
  });

  const refreshtoken = generateToken({
    publicClaims: { _id: user._id },
    registeredClaims: {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
      jwtid: uuidv4(),
    },
    secretKey: process.env.JWT_SECRET_REFRESH,
  });

  return res.status(200).json({ accesstoken, refreshtoken });
};
// ------------------------------------------------------------------
export const GmailLoginService = async (req, res, next) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email_verified, email } = payload;
  if (!email_verified) {
    return res.status(400).json({ message: "Email not verified" });
  }

  const user = await User.findOne({ email, provider: ProvidersEnum.GOOGLE });

  // generate tokens
  const accesstoken = generateToken({
    publicClaims: { _id: user?._id },
    registeredClaims: {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
      jwtid: uuidv4(),
    },
    secretKey: process.env.JWT_SECRET_KEY,
  });

  const refreshtoken = generateToken({
    publicClaims: { _id: user._id },
    registeredClaims: {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
      jwtid: uuidv4(),
    },
    secretKey: process.env.JWT_SECRET_KEY_REFRESH,
  });

  return res.status(200).json({ accesstoken, refreshtoken });
};
// ------------------------------------------------------------------
export const GmailRegistrationService = async (req, res, next) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email_verified, email, name } = payload;
  if (!email_verified) {
    return res.status(400).json({ message: "Email not verified" });
  }

  const userObject = {
    username: name,
    email,
    isConfrimed: true,
    provider: ProvidersEnum.GOOGLE,
    password: hashSync(uuidv4(), +process.env.SALT),
  };

  const user = await User.findOne({ email, provider: ProvidersEnum.GOOGLE });
  if (user) {
    return res.status(400).json({ message: "Email already exists" });
  }

  await User.create(userObject);

  return res.status(200).json({ message: "User created successfully" });
};
// ------------------------------------------------------------------
export const forgotPasswordService = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = hashSync(otp, +process.env.SALT);

    // Save the hashed OTP and its expiry time in the user document
    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpiry = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    console.log('OTP generated and saved for user:', user.email); // Debugging

    // Send OTP via email
    emitter.emit('sendEmail', {
      to: email,
      subject: 'Reset Password',
      html: `<h1>Reset your password</h1><h2>${otp}</h2>`,
    });

    // Respond with success message
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.log('Error in forgotPasswordService:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
// ------------------------------------------------------------------
export const resetPasswordService = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Check if the email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Debugging: Log the user document
    console.log('User document:', user);

    // Check if resetPasswordOtp is set
    if (!user.resetPasswordOtp) {
      return res.status(400).json({ message: 'OTP not generated for this user' });
    }

    // Check if OTP matches and is not expired
    const isOtpValid = compareSync(otp, user.resetPasswordOtp);
    const isOtpExpired = Date.now() > user.resetPasswordOtpExpiry;

    if (!isOtpValid || isOtpExpired) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash the new password
    const hashedPassword = hashSync(newPassword, +process.env.SALT);

    // Update the user's password and clear the OTP fields
    
    await User.updateOne(
      { _id: user._id },
      { password: hashedPassword, $unset: { resetPasswordOtp: "" , resetPasswordOtpExpiry :""} }
    );

    // Respond with success message
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.log('Error in resetPasswordService:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
