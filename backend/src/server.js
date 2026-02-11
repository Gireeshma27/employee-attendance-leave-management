import mongoose from "mongoose";
import app from "./app.js";
import env from "./config/env.js";

let server = null;
let isShuttingDown = false;

const PORT = env.PORT || 5000;

const startServer = async () => {
  // Prevent starting during shutdown
  if (isShuttingDown) {
    console.log("⚠️ Shutdown in progress, skipping start...");
    return;
  }

  // Prevent double listening
  if (server && server.listening) {
    console.log("⚠️ Server already running, skipping...");
    return;
  }

  try {
    // Database Connection first (fail fast if DB is unavailable)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
      console.log("✅ Connected to MongoDB");
    }

    // Start Express Server
    server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Handle server errors (including EADDRINUSE)
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`);
        // Don't call process.exit() - let nodemon handle restart naturally
        // The process will stay alive but won't serve requests
        // Nodemon will detect the issue and handle it appropriately
        server = null;
        return;
      }
      console.error("❌ Server error:", err.message);
    });

  } catch (error) {
    console.error("❌ Backend startup failed:", error.message);
    // Don't exit on startup failures in dev - let nodemon retry
    if (env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Close HTTP server first and wait for it
  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error("Error closing server:", err.message);
        } else {
          console.log("✅ HTTP server closed");
        }
        server = null;
        resolve();
      });
      
      // Force close after 5 seconds
      setTimeout(() => {
        console.log("⚠️ Forcing server close after timeout");
        server = null;
        resolve();
      }, 5000);
    });
  }
  
  // Close MongoDB connection
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
    }
  } catch (err) {
    console.error("Error closing MongoDB:", err.message);
  }
  
  process.exit(0);
};

// Handle shutdown signals (critical for watch mode restarts)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled rejections - don't exit in dev mode
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION!", err.name, err.message);
  if (env.NODE_ENV === "production") {
    gracefulShutdown("UNHANDLED_REJECTION");
  }
});

// Handle uncaught exceptions - don't exit in dev mode
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION!", err.name, err.message);
  if (env.NODE_ENV === "production") {
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  }
});

startServer();
