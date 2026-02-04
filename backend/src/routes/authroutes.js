import express from "express";
import {
  signup,
  login,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/authcontroller.js";
import { validate } from "../middlewares/validatemiddleware.js";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/authvalidation.js";

const router = express.Router();

// Fix: The validation schema names in authvalidation.js were registerSchema, etc.
// Register -> signup
router.post("/register", validate(signupSchema), signup);

// Login
router.post("/login", validate(loginSchema), login);

// Forgot Password
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);

// Reset Password
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Logout
router.post("/logout", logout);

export default router;
