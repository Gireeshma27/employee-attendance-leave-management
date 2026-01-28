import app from "./app.js";
import { connectDB } from "./config/db.js";
import { config } from "./config/env.js";

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(config.PORT, () => {
      console.log(`server running  on port ${config.PORT}
      `);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("\n✓ SIGTERM received, shutting down gracefully...");
      server.close(() => {
        console.log("✓ Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("\n✓ SIGINT received, shutting down gracefully...");
      server.close(() => {
        console.log("✓ Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("✗ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
