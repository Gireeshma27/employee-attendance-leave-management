import express from "express";
import {
  checkIn,
  checkOut,
  getMyAttendance,
  getTeamAttendance,
  downloadExcelReport,
  updateAttendance,
} from "../controllers/attendancecontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
import { validate } from "../middlewares/validatemiddleware.js";
import { getAttendanceSchema } from "../validations/attendancevalidation.js";

const router = express.Router();

// Apply protection to all attendance routes
router.use(protect);

// Employee routes
router.post("/check-in", checkIn);
router.post("/check-out", checkOut);
router.get("/my", validate(getAttendanceSchema), getMyAttendance);

// Admin/Manager routes
router.get("/team", isAdmin, validate(getAttendanceSchema), getTeamAttendance);
router.get(
  "/export/excel",
  isAdmin,
  validate(getAttendanceSchema),
  downloadExcelReport,
);

// Admin route to update attendance record (must be after specific routes)
router.put("/:id", isAdmin, updateAttendance);

export default router;
