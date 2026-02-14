import express from "express";
import {
  getAllTimings,
  getTimingById,
  createTiming,
  updateTiming,
  deleteTiming,
  getTimingByDepartment,
  getLocations,
} from "../controllers/timingcontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
import { sendError } from "#utils/api_response_fix";
import {
  createTimingSchema,
  updateTimingSchema,
} from "../validations/timingvalidation.js";

// Joi validation middleware
const validateJoi = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message).join(", ");
    return sendError(res, messages, "Validation Error", 400);
  }
  next();
};

/**
 * @description Timing Routes for managing login/logout schedules
 * @module routes/timingroutes
 */

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin-only routes
router.get("/", isAdmin, getAllTimings);
router.get("/locations", isAdmin, getLocations);
router.get("/:id", isAdmin, getTimingById);
router.post("/", isAdmin, validateJoi(createTimingSchema), createTiming);
router.patch("/:id", isAdmin, validateJoi(updateTimingSchema), updateTiming);
router.delete("/:id", isAdmin, deleteTiming);

// Route accessible by all authenticated users
router.get("/department/:department", getTimingByDepartment);

export default router;
