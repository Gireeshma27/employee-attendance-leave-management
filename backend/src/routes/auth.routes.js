import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
