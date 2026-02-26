/**
 * Test Data Factories & Seed Data
 * Generates consistent test data for all test suites
 */
import mongoose from "mongoose";
import { hashPassword } from "../../src/utils/password.js";
import { generateToken } from "../../src/utils/jwt.js";

// ─── CONSTANTS ────────────────────────────────────────────────
const TEST_PASSWORD = "Test@1234";
const ROLES = { ADMIN: "ADMIN", MANAGER: "MANAGER", EMPLOYEE: "EMPLOYEE" };

// ─── USER FACTORIES ───────────────────────────────────────────

export const createTestUserData = (overrides = {}) => ({
  name: "Test User",
  email: `testuser_${Date.now()}@example.com`,
  password: TEST_PASSWORD,
  role: ROLES.EMPLOYEE,
  employeeId: `EMP-${Date.now()}`,
  department: "Engineering",
  isActive: true,
  wfhAllowed: false,
  totalWFHDays: 5,
  usedWFHDays: 0,
  ...overrides,
});

export const createAdminData = (overrides = {}) =>
  createTestUserData({
    name: "Test Admin",
    email: `admin_${Date.now()}@example.com`,
    role: ROLES.ADMIN,
    employeeId: `ADM-${Date.now()}`,
    department: "Administration",
    ...overrides,
  });

export const createManagerData = (overrides = {}) =>
  createTestUserData({
    name: "Test Manager",
    email: `manager_${Date.now()}@example.com`,
    role: ROLES.MANAGER,
    employeeId: `MGR-${Date.now()}`,
    department: "Engineering",
    ...overrides,
  });

export const createEmployeeData = (overrides = {}) =>
  createTestUserData({
    name: "Test Employee",
    email: `employee_${Date.now()}@example.com`,
    role: ROLES.EMPLOYEE,
    employeeId: `EMP-${Date.now()}`,
    department: "Engineering",
    ...overrides,
  });

// ─── DATABASE SEEDERS ─────────────────────────────────────────

/**
 * Seed a user into the database and return user + token
 */
export const seedUser = async (User, userData = {}) => {
  const data = createTestUserData(userData);
  const hashedPw = await hashPassword(data.password);
  const user = await User.create({ ...data, password: hashedPw });
  const token = generateToken(user._id, user.email, user.role);
  return { user, token, plainPassword: data.password };
};

export const seedAdmin = async (User) => {
  return seedUser(User, createAdminData());
};

export const seedManager = async (User) => {
  return seedUser(User, createManagerData());
};

export const seedEmployee = async (User, overrides = {}) => {
  return seedUser(User, createEmployeeData(overrides));
};

/**
 * Seed a complete test environment with admin, manager, and employees
 */
export const seedFullEnvironment = async (User) => {
  const admin = await seedAdmin(User);
  const manager = await seedManager(User);
  const employee1 = await seedEmployee(User, {
    managerId: manager.user._id,
    name: "Employee One",
    email: `emp1_${Date.now()}@example.com`,
    employeeId: `EMP1-${Date.now()}`,
  });
  const employee2 = await seedEmployee(User, {
    managerId: manager.user._id,
    name: "Employee Two",
    email: `emp2_${Date.now()}@example.com`,
    employeeId: `EMP2-${Date.now()}`,
    wfhAllowed: true,
  });

  return { admin, manager, employee1, employee2 };
};

// ─── LEAVE FACTORIES ──────────────────────────────────────────

export const createLeaveData = (userId, overrides = {}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  return {
    userId,
    leaveType: "CL",
    fromDate: tomorrow,
    toDate: dayAfter,
    numberOfDays: 2,
    reason: "Personal work",
    status: "Pending",
    ...overrides,
  };
};

export const createLeaveRequestBody = (overrides = {}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 2);

  return {
    leaveType: "CL",
    fromDate: tomorrow.toISOString().split("T")[0],
    toDate: dayAfter.toISOString().split("T")[0],
    numberOfDays: 2,
    reason: "Personal work",
    ...overrides,
  };
};

// ─── ATTENDANCE FACTORIES ─────────────────────────────────────

export const createAttendanceData = (userId, overrides = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    userId,
    date: today,
    checkInTime: new Date(),
    status: "Present",
    workingHours: 0,
    workingMinutes: 0,
    ...overrides,
  };
};

// ─── TIMING FACTORIES ─────────────────────────────────────────

export const createTimingData = (overrides = {}) => ({
  location: "Mysore",
  branch: "Main Office",
  teamName: `Team-${Date.now()}`,
  loginTime: "09:00",
  logoutTime: "18:00",
  departments: ["Engineering"],
  isActive: true,
  ...overrides,
});

// ─── NOTIFICATION FACTORIES ───────────────────────────────────

export const createNotificationData = (recipientId, senderId, overrides = {}) => ({
  recipient: recipientId,
  sender: senderId,
  type: "LEAVE_REQUEST",
  title: "Test Notification",
  message: "This is a test notification",
  isRead: false,
  ...overrides,
});

// ─── OFFICE FACTORIES ─────────────────────────────────────────

export const createOfficeData = (overrides = {}) => ({
  name: "Test Office",
  description: "Test office description",
  address: "123 Test Street",
  coords: [12.3456, 76.6543],
  radius: 100,
  status: "Active",
  ...overrides,
});

// ─── EXPIRED TOKEN GENERATOR ──────────────────────────────────

export const generateExpiredToken = () => {
  // Return a structurally valid but expired JWT
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1MDAwMDAwMDAwMDAwMDAwMDAwMDAwMCIsImVtYWlsIjoiZXhwaXJlZEB0ZXN0LmNvbSIsInJvbGUiOiJFTVBMT1lFRSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.invalid";
};

// ─── SECURITY TEST PAYLOADS ───────────────────────────────────

export const INJECTION_PAYLOADS = {
  sqlInjection: [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1; SELECT * FROM users",
    "admin'--",
    "' UNION SELECT * FROM users--",
  ],
  nosqlInjection: [
    '{"$gt": ""}',
    '{"$ne": null}',
    '{"$regex": ".*"}',
  ],
  xssPayloads: [
    '<script>alert("XSS")</script>',
    '"><img src=x onerror=alert(1)>',
    "javascript:alert(1)",
    '<svg onload=alert(1)>',
  ],
  pathTraversal: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32",
    "%2e%2e%2f%2e%2e%2f",
  ],
};

export { TEST_PASSWORD, ROLES };

export default {
  TEST_PASSWORD,
  ROLES,
  createTestUserData,
  createAdminData,
  createManagerData,
  createEmployeeData,
  seedUser,
  seedAdmin,
  seedManager,
  seedEmployee,
  seedFullEnvironment,
  createLeaveData,
  createLeaveRequestBody,
  createAttendanceData,
  createTimingData,
  createNotificationData,
  createOfficeData,
  generateExpiredToken,
  INJECTION_PAYLOADS,
};
