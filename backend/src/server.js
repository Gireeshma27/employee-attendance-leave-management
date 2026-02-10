import mongoose from "mongoose";
import app from "./app.js";
import env from "./config/env.js";

let server = null;

const startServer = async () => {
  try {
    // Prevent double listening
    if (server) {
      console.log("⚠️ Server already running, skipping...");
      return;
    }

    const PORT = env.PORT || 5000;
    
    // Start Express Server
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Handle server errors (including EADDRINUSE)
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. Exiting...`);
        process.exit(1);
      }
      throw err;
    });

    // Database Connection (Async - Queries will buffer)
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Backend startup failed:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  if (server) {
    server.close(() => {
      console.log("✅ HTTP server closed");
    });
  }
  
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
  } catch (err) {
    console.error("Error closing MongoDB:", err.message);
  }
  
  process.exit(0);
};

// Handle shutdown signals (critical for watch mode restarts)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

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
