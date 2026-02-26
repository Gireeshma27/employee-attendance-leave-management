import express from "express";
import {
  getAdminDashboardStats,
  getEmployeeDashboardStats,
  getManagerDashboardStats,
} from "../controllers/dashboardcontroller.js";
import protect from "../middlewares/protectmiddleware.js";
import isAdmin from "../middlewares/isadminmiddleware.js";

/**
 * @description Dashboard Statistics Routes
 * @module routes/dashboardroutes
 */

const router = express.Router();

router.use(protect);
router.get("/admin", isAdmin, getAdminDashboardStats);
router.get("/employee", getEmployeeDashboardStats);
router.get("/manager", getManagerDashboardStats);

export default router;
