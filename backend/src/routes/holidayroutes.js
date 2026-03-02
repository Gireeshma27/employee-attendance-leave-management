import express from "express";
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../controllers/holidaycontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
import { validate } from "../middlewares/validatemiddleware.js";
import {
  createHolidaySchema,
  updateHolidaySchema,
  deleteHolidaySchema,
} from "../validations/holidayvalidation.js";

const router = express.Router();

// Apply protection to all holiday routes
router.use(protect);

// All authenticated users can view holidays
router.get("/", getHolidays);

// Admin-only routes
router.post("/", isAdmin, validate(createHolidaySchema), createHoliday);
router.put("/:id", isAdmin, validate(updateHolidaySchema), updateHoliday);
router.delete("/:id", isAdmin, validate(deleteHolidaySchema), deleteHoliday);

export default router;
