import mongoose from "mongoose";
import app from "./app.js";
import env from "./config/env.js";

const startServer = async () => {
  try {
    // Start Express Server Immediately
    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });

    // Database Connection (Async - Queries will buffer)
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Backend startup failed:", error.message);
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
