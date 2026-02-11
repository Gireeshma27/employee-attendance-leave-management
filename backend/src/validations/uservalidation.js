import { z } from "zod";

/**
 * @description User validation schemas.
 * @module validations/uservalidation
 */

const DEPARTMENTS = ["Administration", "HR", "Engineering", "Design", "Marketing"];

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
    employeeId: z.string().optional(),
    department: z.enum(DEPARTMENTS, { required_error: "Department is required" }),
    wfhAllowed: z.boolean().optional(),
    totalWFHDays: z.number().min(0).max(30).optional(),
    usedWFHDays: z.number().min(0).max(30).optional(),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
    isActive: z.boolean().optional(),
    department: z.enum(DEPARTMENTS).optional(),
    phone: z.string().optional(),
    wfhAllowed: z.boolean().optional(),
    totalWFHDays: z.number().min(0).max(30).optional(),
    usedWFHDays: z.number().min(0).max(30).optional(),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    department: z.enum(DEPARTMENTS).optional(),
  }),
});

export { createUserSchema, updateUserSchema, updateProfileSchema };
export default { createUserSchema, updateUserSchema, updateProfileSchema };
