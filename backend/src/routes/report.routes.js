import express from "express";
import { getAdminReportData } from "../controllers/report.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/admin", authMiddleware, isAdmin, getAdminReportData);

export default router;
