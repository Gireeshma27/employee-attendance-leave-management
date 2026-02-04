import { z } from "zod";

/**
 * @description User validation schemas.
 * @module validations/uservalidation
 */

const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
    employeeId: z.string().optional(),
    department: z.string().optional(),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
    isActive: z.boolean().optional(),
    department: z.string().optional(),
    phone: z.string().optional(),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
  }),
});

export { createUserSchema, updateUserSchema, updateProfileSchema };
export default { createUserSchema, updateUserSchema, updateProfileSchema };
