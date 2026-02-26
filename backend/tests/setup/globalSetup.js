/**
 * Global Test Setup
 * Runs once before all test suites
 */
import { MongoMemoryServer } from "mongodb-memory-server";

export default async function globalSetup() {
  // Start in-memory MongoDB instance for tests
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27018,
      dbName: "test_employee_attendance",
    },
  });

  const uri = mongod.getUri();

  // Store the instance and URI for global teardown
  globalThis.__MONGOD__ = mongod;
  process.env.MONGODB_URI = uri;
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only-min10chars";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.EMAIL_USER = "test@example.com";
  process.env.EMAIL_PASSWORD = "test-password";
  process.env.FRONTEND_URL = "http://localhost:3000";
  process.env.PORT = "5001";

  console.log(`\n🧪 Test MongoDB started at: ${uri}\n`);
}
