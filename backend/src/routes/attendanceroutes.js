import express from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getTeamAttendance,
  downloadExcelReport,
} from "../controllers/attendancecontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
import { validate } from "../middlewares/validatemiddleware.js";
import { getAttendanceSchema } from "../validations/attendancevalidation.js";

/**
 * @description Attendance Routes
 * @module routes/attendanceroutes
 */

const router = express.Router();

// Apply protection to all attendance routes
router.use(protect);

// Employee routes
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/my-attendance", validate(getAttendanceSchema), getMyAttendance);

// Admin/Manager routes
router.get("/team", isAdmin, validate(getAttendanceSchema), getTeamAttendance);
router.get(
  "/report",
  isAdmin,
  validate(getAttendanceSchema),
  downloadExcelReport,
);

export default router;
