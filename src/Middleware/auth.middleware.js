import { BlacklistToken } from "../DB/models/black-list-tokens.model.js";
import { User } from "../DB/models/index.js";
import { verifyToken } from "../utils/tokens.utils.js";

const validateUserToken = async (accesstoken) => {
  try {
    const decodedToken = verifyToken({
      token: accesstoken,
      secretKey: process.env.JWT_SECRET,
    });

    const isTokenBlacklisted = await BlacklistToken.findOne({
      tokenId: decodedToken.jti,
    });

    if (isTokenBlacklisted) {
      return null; // Instead of throwing, return null
    }

    const user = await User.findById(decodedToken._id, "-password -__v");
    if (!user) {
      return null; // User not found
    }

    return {
      ...user._doc,
      token: { tokenId: decodedToken.jti, expiresAt: decodedToken.exp },
    };
  } catch (error) {
    return null; // Return null if token is invalid
  }
};


export const authenticationMiddleware = (socketToken) => {
  if (socketToken) return validateUserToken(socketToken);

  return async (req, res, next) => {
    try {
      const { accesstoken } = req.headers;
      if (!accesstoken) {
        return res.status(401).json({ message: "Unauthorized: Please login." });
      }

      // Validate token and check if user exists
      const user = await validateUserToken(accesstoken);
      if (!user) {
        return res.status(401).json({ message: "Invalid or expired token. Please login again." });
      }

      req.loggedInUser = user;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

