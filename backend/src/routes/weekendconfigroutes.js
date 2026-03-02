import express from "express";
import { getWeekendConfig, updateWeekendConfig } from "../controllers/weekendconfigcontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";

const router = express.Router();

// All authenticated users can read weekend config
router.use(protect);
router.get("/", getWeekendConfig);

// Admin-only: update
router.put("/", isAdmin, updateWeekendConfig);

export default router;
