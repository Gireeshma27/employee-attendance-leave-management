import jwt from "jsonwebtoken";
import User from "#models/user";
import env from "../config/env.js";
import { sendError } from "#utils/api_response_fix";

/**
 * @description Authentication middleware to protect routes.
 * @module middlewares/protect
 */

/**
 * Middleware to verify JWT and attach user to request.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Next middleware function.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(
        res,
        "Not authorized, please log in",
        "Authentication required",
        401,
      );
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return sendError(res, "User no longer exists", "User not found", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, "Not authorized, token failed", error.message, 401);
  }
};

export default protect;
