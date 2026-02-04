import { z } from "zod";

/**
 * @description Leave validation schemas.
 * @module validations/leavevalidation
 */

const applyLeaveSchema = z.object({
  body: z.object({
    leaveType: z.enum(["CL", "SL", "PL", "UL"]),
    fromDate: z.string(),
    toDate: z.string(),
    numberOfDays: z.number().positive(),
    reason: z.string().min(1, "Reason is required").max(1000),
  }),
});

const rejectLeaveSchema = z.object({
  body: z.object({
    rejectionReason: z.string().min(1, "Rejection reason is required").max(500),
  }),
});

const getLeavesSchema = z.object({
  query: z.object({
    status: z.enum(["Pending", "Approved", "Rejected"]).optional(),
    employeeId: z.string().optional(),
    leaveType: z.enum(["CL", "SL", "PL", "UL"]).optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export { applyLeaveSchema, rejectLeaveSchema, getLeavesSchema };
export default { applyLeaveSchema, rejectLeaveSchema, getLeavesSchema };
