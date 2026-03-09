import express from "express";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";
import { getSettings, updateSettings } from "../controllers/settingscontroller.js";

const router = express.Router();

// GET /api/v1/settings — All authenticated users (for reading defaults in forms)
router.get("/", protect, getSettings);

// PUT /api/v1/settings — Admin only
router.put("/", protect, isAdmin, updateSettings);

export default router;
