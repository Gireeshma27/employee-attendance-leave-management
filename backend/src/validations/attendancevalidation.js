import { z } from "zod";

/**
 * @description Attendance validation schemas.
 * @module validations/attendancevalidation
 */

const getAttendanceSchema = z.object({
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    status: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.enum(["Present", "Absent", "Half-day", "WFH", "Leave"]).optional(),
    ),
    department: z.string().optional(),
    role: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]).optional(),
    ),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export { getAttendanceSchema };
export default { getAttendanceSchema };
