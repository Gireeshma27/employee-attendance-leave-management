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
} from "../controllers/usercontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
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

/**
 * MANAGEMENT ROUTES
 * (Accessed by Admin or Manager - check logic in controller)
 */
router.patch("/:id/assign-location", assignLocation);
router.patch("/:id/wfh-permission", updateWFHPermission);

/**
 * ADMIN ONLY ROUTES
 */
router.use(isAdmin);
router.get("/", getAllUsers);
router.post("/", validate(createUserSchema), createUser);
router.get("/:id", getUserById);
router.put("/:id", validate(updateUserSchema), updateUser);

export default router;
