import express from "express";
import {
  getAllUsers,
  getUserById,
  getProfile,
  updateProfile,
  createUser,
  updateUser,
} from "../controllers/usercontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
import { validate } from "../middlewares/validatemiddleware.js";
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
} from "../validations/uservalidation.js";

/**
 * @description User Management Routes
 * @module routes/userroutes
 */

const router = express.Router();

router.use(protect);

// Profile routes
router.get("/profile", getProfile);
router.put("/profile", validate(updateProfileSchema), updateProfile);

// Admin routes
router.use(isAdmin);
router.get("/", getAllUsers);
router.post("/", validate(createUserSchema), createUser);
router.get("/:id", getUserById);
router.put("/:id", validate(updateUserSchema), updateUser);

export default router;
