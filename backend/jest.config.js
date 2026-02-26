/**
 * Jest Configuration for Backend Testing
 * Employee Attendance & Leave Management System
 */
export default {
  // Use ESM transform
  transform: {},
  extensionsToTreatAsEsm: [],

  // Test environment
  testEnvironment: "node",

  // Module name mapping (mirrors package.json "imports")
  moduleNameMapper: {
    "^#config/(.*)$": "<rootDir>/src/config/$1.js",
    "^#controllers/(.*)$": "<rootDir>/src/controllers/$1.js",
    "^#middlewares/(.*)$": "<rootDir>/src/middlewares/$1.js",
    "^#models/(.*)$": "<rootDir>/src/models/$1.js",
    "^#utils/(.*)$": "<rootDir>/src/utils/$1.js",
    "^#validations/(.*)$": "<rootDir>/src/validations/$1.js",
  },

  // Test file patterns
  testMatch: [
    "<rootDir>/tests/**/*.test.js",
    "<rootDir>/tests/**/*.spec.js",
  ],

  // Setup files
  globalSetup: "<rootDir>/tests/setup/globalSetup.js",
  globalTeardown: "<rootDir>/tests/setup/globalTeardown.js",
  setupFilesAfterFramework: [],

  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/controllers/**/*.js",
    "src/middlewares/**/*.js",
    "src/utils/**/*.js",
    "src/validations/**/*.js",
    "src/models/**/*.js",
    "!src/config/**",
    "!src/server.js",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ["text", "text-summary", "lcov", "json-summary"],

  // Test isolation
  forceExit: true,
  detectOpenHandles: true,

  // Timeouts
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Projects for different test suites
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
      testEnvironment: "node",
      transform: {},
      moduleNameMapper: {
        "^#config/(.*)$": "<rootDir>/src/config/$1.js",
        "^#controllers/(.*)$": "<rootDir>/src/controllers/$1.js",
        "^#middlewares/(.*)$": "<rootDir>/src/middlewares/$1.js",
        "^#models/(.*)$": "<rootDir>/src/models/$1.js",
        "^#utils/(.*)$": "<rootDir>/src/utils/$1.js",
        "^#validations/(.*)$": "<rootDir>/src/validations/$1.js",
      },
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
      testEnvironment: "node",
      transform: {},
      moduleNameMapper: {
        "^#config/(.*)$": "<rootDir>/src/config/$1.js",
        "^#controllers/(.*)$": "<rootDir>/src/controllers/$1.js",
        "^#middlewares/(.*)$": "<rootDir>/src/middlewares/$1.js",
        "^#models/(.*)$": "<rootDir>/src/models/$1.js",
        "^#utils/(.*)$": "<rootDir>/src/utils/$1.js",
        "^#validations/(.*)$": "<rootDir>/src/validations/$1.js",
      },
    },
  ],
};
