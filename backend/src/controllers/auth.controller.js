import User from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import ApiResponse from "../utils/apiResponse.js";
import crypto from "crypto";

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return ApiResponse.badRequest(res, "Please provide all required fields.");
    }

    if (password !== confirmPassword) {
      return ApiResponse.badRequest(res, "Passwords do not match.");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.conflict(res, "User with this email already exists.");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "EMPLOYEE", // Default role
    });

    const token = generateToken(user._id, user.email, user.role);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return ApiResponse.created(res, "User registered successfully.", {
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Register error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Registration failed.",
    );
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return ApiResponse.badRequest(res, "Please provide email and password.");
    }

    // Find user with password field (it's hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
      return ApiResponse.unauthorized(res, "Invalid email or password.");
    }

    // Check if user is active
    if (!user.isActive) {
      return ApiResponse.forbidden(res, "Your account has been deactivated.");
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return ApiResponse.unauthorized(res, "Invalid email or password.");
    }

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return ApiResponse.success(res, 200, "Login successful.", {
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    return ApiResponse.serverError(res, error.message || "Login failed.");
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ApiResponse.badRequest(res, "Please provide an email address.");
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return ApiResponse.notFound(res, "User with this email does not exist.");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Update user with reset token and expiry (1 hour)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      // If email fails, clear the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return ApiResponse.serverError(
        res,
        "Failed to send reset email. Please try again later.",
      );
    }

    return ApiResponse.success(
      res,
      200,
      "Password reset link sent to your email.",
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Forgot password request failed.",
    );
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return ApiResponse.badRequest(res, "Please provide all required fields.");
    }

    if (newPassword !== confirmPassword) {
      return ApiResponse.badRequest(res, "Passwords do not match.");
    }

    // Hash the token to find the user
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return ApiResponse.badRequest(res, "Invalid or expired reset token.");
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return ApiResponse.success(
      res,
      200,
      "Password reset successful. You can now login with your new password.",
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Password reset failed.",
    );
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    return ApiResponse.success(res, 200, "Logged out successfully.");
  } catch (error) {
    console.error("Logout error:", error);
    return ApiResponse.serverError(res, error.message || "Logout failed.");
  }
};

export default { register, login, forgotPassword, resetPassword, logout };
