import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { isManager } from "../middlewares/role.middleware.js";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getTeamAttendance,
  downloadExcelReport,
} from "../controllers/attendance.controller.js";

const router = express.Router();

// Protected routes - require authentication
router.post("/check-in", authMiddleware, checkIn);
router.post("/check-out", authMiddleware, checkOut);
router.get("/my", authMiddleware, getMyAttendance);

// Manager and admin routes
router.get("/team", authMiddleware, isManager, getTeamAttendance);
router.get("/report", authMiddleware, isManager, downloadExcelReport);
router.get("/export/excel", authMiddleware, isManager, downloadExcelReport);

export default router;
