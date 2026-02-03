import mongoose from "mongoose";
import app from "./app.js";
import env from "./config/env.js";

/**
 * @description Server Entry Point
 * @module server
 */

const startServer = async () => {
  try {
    // Database Connection
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Start Express Server
    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error(
    "❌ UNHANDLED REJECTION! Shutting down...",
    err.name,
    err.message,
  );
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(
    "❌ UNCAUGHT EXCEPTION! Shutting down...",
    err.name,
    err.message,
  );
  process.exit(1);
});

startServer();
