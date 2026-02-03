import { z } from "zod";

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

const queryWithEmptyStrings = {
  page: "1",
  limit: "10",
  fromDate: "2026-02-03",
  toDate: "2026-02-03",
  search: "",
  status: "",
  department: "",
  role: "",
};

try {
  getAttendanceSchema.parse({ query: queryWithEmptyStrings });
  console.log("Validation passed successfully with empty strings");
} catch (error) {
  console.log("Validation failed:");
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.log(`- Path: ${err.path.join(".")}, Message: ${err.message}`);
    });
  } else {
    console.log(error);
  }
}
