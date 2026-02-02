<<<<<<< HEAD
import User from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';
import ApiResponse from '../utils/apiResponse.js';
import crypto from 'crypto';
=======
import User from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import ApiResponse from "../utils/apiResponse.js";
import crypto from "crypto";
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
<<<<<<< HEAD
      return ApiResponse.badRequest(res, 'Please provide all required fields.');
    }

    if (password !== confirmPassword) {
      return ApiResponse.badRequest(res, 'Passwords do not match.');
=======
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    if (password !== confirmPassword) {
      return ApiResponse.badRequest(res, "Passwords do not match.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
<<<<<<< HEAD
      return ApiResponse.conflict(res, 'User with this email already exists.');
=======
      return ApiResponse.conflict(res, "User with this email already exists.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
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

<<<<<<< HEAD
    return ApiResponse.created(res, 'User registered successfully.', {
=======
    return ApiResponse.created(res, "User registered successfully.", {
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
      token,
      user: userResponse,
    });
  } catch (error) {
<<<<<<< HEAD
    console.error('Register error:', error);
    return ApiResponse.serverError(res, error.message || 'Registration failed.');
=======
    console.error("Register error:", error);
    return ApiResponse.serverError(
      res,
      error.message || "Registration failed.",
    );
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
<<<<<<< HEAD
      return ApiResponse.badRequest(res, 'Please provide email and password.');
=======
      return ApiResponse.badRequest(res, "Please provide email and password.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
    }

    // Find user with password field (it's hidden by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user) {
<<<<<<< HEAD
      return ApiResponse.unauthorized(res, 'Invalid email or password.');
=======
      return ApiResponse.unauthorized(res, "Invalid email or password.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
    }

    // Check if user is active
    if (!user.isActive) {
<<<<<<< HEAD
      return ApiResponse.forbidden(res, 'Your account has been deactivated.');
=======
      return ApiResponse.forbidden(res, "Your account has been deactivated.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
<<<<<<< HEAD
      return ApiResponse.unauthorized(res, 'Invalid email or password.');
=======
      return ApiResponse.unauthorized(res, "Invalid email or password.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
    }

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

<<<<<<< HEAD
    return ApiResponse.success(res, 200, 'Login successful.', {
=======
    return ApiResponse.success(res, 200, "Login successful.", {
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
      token,
      user: userResponse,
    });
  } catch (error) {
<<<<<<< HEAD
    console.error('Login error:', error);
    return ApiResponse.serverError(res, error.message || 'Login failed.');
=======
    console.error("Login error:", error);
    return ApiResponse.serverError(res, error.message || "Login failed.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
<<<<<<< HEAD
      return ApiResponse.badRequest(res, 'Please provide an email address.');
=======
      return ApiResponse.badRequest(res, "Please provide an email address.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
<<<<<<< HEAD
      return ApiResponse.notFound(res, 'User with this email does not exist.');
=======
      return ApiResponse.notFound(res, "User with this email does not exist.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Update user with reset token and expiry (1 hour)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Construct reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      // If email fails, clear the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

<<<<<<< HEAD
      return ApiResponse.serverError(res, 'Failed to send reset email. Please try again later.');
    }

    return ApiResponse.success(res, 200, 'Password reset link sent to your email.');
  } catch (error) {
    console.error('Forgot password error:', error);
    return ApiResponse.serverError(res, error.message || 'Forgot password request failed.');
=======
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
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
<<<<<<< HEAD
      return ApiResponse.badRequest(res, 'Please provide all required fields.');
    }

    if (newPassword !== confirmPassword) {
      return ApiResponse.badRequest(res, 'Passwords do not match.');
=======
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
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
<<<<<<< HEAD
      return ApiResponse.badRequest(res, 'Invalid or expired reset token.');
=======
      return ApiResponse.badRequest(res, "Invalid or expired reset token.");
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

<<<<<<< HEAD
    return ApiResponse.success(res, 200, 'Password reset successful. You can now login with your new password.');
  } catch (error) {
    console.error('Reset password error:', error);
    return ApiResponse.serverError(res, error.message || 'Password reset failed.');
=======
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
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed.",
    });
>>>>>>> 5ac8cd0c0ea525059ca23962c6bb20b870e5ce3b
  }
};

export default { register, login, forgotPassword, resetPassword, logout };
