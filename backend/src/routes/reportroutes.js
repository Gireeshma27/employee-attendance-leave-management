import express from "express";
import { getAdminReportData } from "../controllers/reportcontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";

/**
 * @description Report Routes
 * @module routes/reportroutes
 */

const router = express.Router();

router.use(protect);
router.get("/admin", isAdmin, getAdminReportData);

export default router;
