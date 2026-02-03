import crypto from "crypto";
import User from "#models/user.model";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import { sendSuccess, sendError } from "#utils/api_response_fix";
import env from "../config/env.js";

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(
        res,
        "User with this email already exists",
        "Conflict",
        409,
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "EMPLOYEE",
    });

    const token = generateToken(user._id, user.email, user.role);

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(
      res,
      "User registered successfully",
      { token, user: userObj },
      201,
    );
  } catch (error) {
    return sendError(res, "Registration failed", error.message);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user || !(await comparePassword(password, user.password))) {
      return sendError(res, "Invalid email or password", "Unauthorized", 401);
    }

    if (!user.isActive) {
      return sendError(
        res,
        "Your account has been deactivated",
        "Forbidden",
        403,
      );
    }

    const token = generateToken(user._id, user.email, user.role);

    const userObj = user.toObject();
    delete userObj.password;

    return sendSuccess(res, "Login successful", { token, user: userObj });
  } catch (error) {
    return sendError(res, "Login failed", error.message);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return sendError(
        res,
        "User with this email does not exist",
        "Not Found",
        404,
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
      return sendSuccess(res, "Password reset link sent to your email");
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return sendError(
        res,
        "Failed to send reset email. Please try again later",
        emailError.message,
      );
    }
  } catch (error) {
    return sendError(res, "Forgot password request failed", error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(
        res,
        "Invalid or expired reset token",
        "Bad Request",
        400,
      );
    }

    user.password = await hashPassword(newPassword);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return sendSuccess(res, "Password reset successful. You can now login.");
  } catch (error) {
    return sendError(res, "Password reset failed", error.message);
  }
};

const logout = async (req, res) => {
  return sendSuccess(res, "Logged out successfully");
};

export { signup, login, forgotPassword, resetPassword, logout };
