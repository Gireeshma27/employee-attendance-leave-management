/**
 * Test Database Helper
 * Manages MongoDB connection for integration tests
 */
import mongoose from "mongoose";

const DB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27018/test_employee_attendance";

/**
 * Connect to the test database
 */
export const connectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }
  await mongoose.connect(DB_URI);
};

/**
 * Disconnect from the test database
 */
export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

/**
 * Clear all collections in the test database
 */
export const clearTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Drop the test database
 */
export const dropTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
  }
};

export default {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  dropTestDB,
};
