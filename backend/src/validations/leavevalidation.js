import { z } from "zod";

/**
 * @description Leave validation schemas.
 * @module validations/leavevalidation
 */

const applyLeaveSchema = z.object({
  body: z.object({
    leaveType: z.enum(["Casual", "Sick", "Paid", "Unpaid"]),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid start date format",
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid end date format",
    }),
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
    leaveType: z.enum(["Casual", "Sick", "Paid", "Unpaid"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export { applyLeaveSchema, rejectLeaveSchema, getLeavesSchema };
export default { applyLeaveSchema, rejectLeaveSchema, getLeavesSchema };
