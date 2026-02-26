import express from "express";
/*
 * GEOFENCING/OFFICE ROUTES TEMPORARILY DISABLED
 * 
 * To re-enable geofencing:
 * 1. Uncomment the imports and routes below
 * 2. Re-enable the frontend geofencing page and components
 * 3. Re-enable sidebar link in DashboardLayout.js
 */

/*
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
*/

/**
 * @description Office Routes - TEMPORARILY DISABLED
 * @module routes/officeroutes
 */

const router = express.Router();

// GEOFENCING ROUTES DISABLED
/*
router.use(protect);

// Public (authenticated) routes
router.get("/", getAllOffices);

// Admin-only routes
router.post("/", isAdmin, validate(createOfficeSchema), createOffice);
router.put("/:id", isAdmin, validate(updateOfficeSchema), updateOffice);
router.delete("/:id", isAdmin, deleteOffice);
*/

export default router;
