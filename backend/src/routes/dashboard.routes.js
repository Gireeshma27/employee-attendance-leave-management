import express from "express";
import { getAdminDashboardStats } from "../controllers/dashboard.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/admin", authMiddleware, isAdmin, getAdminDashboardStats);

export default router;
