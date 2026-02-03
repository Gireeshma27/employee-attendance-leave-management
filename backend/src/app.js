import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import errorHandler from "./middlewares/error.middleware.js";
import ApiResponse from "./utils/apiResponse.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import leaveRoutes from "./routes/leave.routes.js";

const app = express();

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS Configuration - Must be before routes
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV === "production") {
      // In production, restrict to configured frontend URL
      const frontendUrl = config.FRONTEND_URL;
      if (origin === frontendUrl) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
  maxAge: 86400, // Cache preflight for 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get("/api/v1/health", (req, res) => {
  ApiResponse.success(res, 200, "API is running", {
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/leaves", leaveRoutes);

// 404 Route
app.use((req, res) => {
  ApiResponse.notFound(res, "Route not found");
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
