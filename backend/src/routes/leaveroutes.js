import express from "express";
import {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getAllLeavesForAdmin,
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

router.use(protect);

// Employee routes
router.post("/apply", validate(applyLeaveSchema), applyLeave);
router.get("/my", validate(getLeavesSchema), getMyLeaves);
router.delete("/:leaveId", cancelLeave);

// Admin/Manager routes
router.get("/pending", isAdminOrManager, validate(getLeavesSchema), getPendingLeaves);
router.get(
  "/admin/all",
  isAdminOrManager,
  validate(getLeavesSchema),
  getAllLeavesForAdmin,
);
router.patch("/:leaveId/approve", isAdminOrManager, approveLeave);
router.patch(
  "/:leaveId/reject",
  isAdminOrManager,
  validate(rejectLeaveSchema),
  rejectLeave,
);

export default router;
