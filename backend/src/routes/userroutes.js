import express from "express";
import {
  getAllUsers,
  getUserById,
  getProfile,
  updateProfile,
  createUser,
  updateUser,
  assignLocation,
  updateWFHPermission,
  changePassword,
  getDepartments,
} from "../controllers/usercontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
import isAdminOrManager from "../middlewares/isadminormanagermiddleware.js";
import { validate } from "../middlewares/validatemiddleware.js";
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validations/uservalidation.js";

const router = express.Router();

router.use(protect);

// Profile routes (All authenticated users)
router.get("/profile", getProfile);
router.put("/profile", validate(updateProfileSchema), updateProfile);
router.post(
  "/profile/change-password",
  validate(changePasswordSchema),
  changePassword,
);

// Get departments (available to all authenticated users)
router.get("/departments", getDepartments);

/**
 * MANAGEMENT ROUTES
 * (Accessed by Admin or Manager - check logic in controller)
 */
router.patch("/:id/assign-location", assignLocation);
router.patch("/:id/wfh-permission", updateWFHPermission);

/**
 * READ-ONLY ROUTES (Admin and Manager can view users and team members)
 */
router.get("/", isAdminOrManager, getAllUsers);
router.get("/:id", isAdminOrManager, getUserById);

/**
 * ADMIN ONLY - WRITE OPERATIONS (Only admin can create/update/delete)
 */
router.post("/", isAdmin, validate(createUserSchema), createUser);
router.put("/:id", isAdmin, validate(updateUserSchema), updateUser);

export default router;
