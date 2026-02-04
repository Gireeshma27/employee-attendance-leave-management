import express from "express";
import { getAdminDashboardStats } from "../controllers/dashboardcontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";

/**
 * @description Dashboard Statistics Routes
 * @module routes/dashboardroutes
 */

const router = express.Router();

router.use(protect);
router.get("/admin", isAdmin, getAdminDashboardStats);

export default router;
