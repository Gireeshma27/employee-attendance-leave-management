import express from "express";
import {
  getAllOffices,
  createOffice,
  updateOffice,
  deleteOffice,
} from "../controllers/officecontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
import { validate } from "../middlewares/validatemiddleware.js";
import {
  createOfficeSchema,
  updateOfficeSchema,
} from "../validations/officevalidation.js";

/**
 * @description Office Routes
 * @module routes/officeroutes
 */

const router = express.Router();

router.use(protect);

// Public (authenticated) routes
router.get("/", getAllOffices);

// Admin-only routes
router.post("/", isAdmin, validate(createOfficeSchema), createOffice);
router.put("/:id", isAdmin, validate(updateOfficeSchema), updateOffice);
router.delete("/:id", isAdmin, deleteOffice);

export default router;
