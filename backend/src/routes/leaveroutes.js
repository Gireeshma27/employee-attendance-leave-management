import express from "express";
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  deleteLeave,
} from "../controllers/leavecontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
import isAdminOrManager from "../middlewares/isadminormanagermiddleware.js";
import { validate } from "../middlewares/validatemiddleware.js";
import {
  applyLeaveSchema,
  rejectLeaveSchema,
  getLeavesSchema,
} from "../validations/leavevalidation.js";

/**
 * @description Leave Routes
 * @module routes/leaveroutes
 */

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee routes
router.post("/", validate(applyLeaveSchema), applyLeave);
router.get("/my", validate(getLeavesSchema), getMyLeaves);
router.delete("/:id/cancel", cancelLeave);

// Admin/Manager routes
router.get("/", isAdminOrManager, validate(getLeavesSchema), getAllLeaves);
router.put("/:id/approve", isAdminOrManager, approveLeave);
router.put("/:id/reject", isAdminOrManager, validate(rejectLeaveSchema), rejectLeave);
router.delete("/:id", isAdmin, deleteLeave);

export default router;
