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
router.get("/my-leaves", validate(getLeavesSchema), getMyLeaves);
router.delete("/cancel/:leaveId", cancelLeave);

// Admin/Manager routes
router.get("/pending", isAdmin, validate(getLeavesSchema), getPendingLeaves);
router.patch("/approve/:leaveId", isAdmin, approveLeave);
router.patch(
  "/reject/:leaveId",
  isAdmin,
  validate(rejectLeaveSchema),
  rejectLeave,
);
router.get("/all", isAdmin, validate(getLeavesSchema), getAllLeavesForAdmin);

export default router;
