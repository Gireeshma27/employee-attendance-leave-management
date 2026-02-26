import express from "express";
import cors from "cors";
import env from "./config/env.js";
import globalErrorHandler from "./middlewares/errormiddleware.js";
import { sendSuccess, sendError } from "#utils/api_response_fix";

// Import Routes
import authRoutes from "./routes/authroutes.js";
import attendanceRoutes from "./routes/attendanceroutes.js";
import leaveRoutes from "./routes/leaveroutes.js";
import officeRoutes from "./routes/officeroutes.js";
import reportRoutes from "./routes/reportroutes.js";
import userRoutes from "./routes/userroutes.js";
import dashboardRoutes from "./routes/dashboardroutes.js";
import notificationRoutes from "./routes/notificationroutes.js";
import timingRoutes from "./routes/timingroutes.js";
// We'll import other routes as we refactor them

const app = express();

// Middlewares
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/api/v1/health", (req, res) => {
  return sendSuccess(res, "System is healthy", {
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leaves", leaveRoutes);
app.use("/api/v1/offices", officeRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/timings", timingRoutes);

// 404 Handler
app.use((req, res) => {
  return sendError(res, `Route ${req.originalUrl} not found`, "Not Found", 404);
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
export { app };
