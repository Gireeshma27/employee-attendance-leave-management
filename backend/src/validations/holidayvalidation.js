import { z } from "zod";

/**
 * @description Holiday validation schemas.
 * @module validations/holidayvalidation
 */

const createHolidaySchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    type: z.enum(["FESTIVAL", "COMPANY"]).optional().default("FESTIVAL"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  }),
});

const updateHolidaySchema = z.object({
  params: z.object({
    id: z.string().min(1, "Holiday ID is required"),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    type: z.enum(["FESTIVAL", "COMPANY"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

const deleteHolidaySchema = z.object({
  params: z.object({
    id: z.string().min(1, "Holiday ID is required"),
  }),
});

export { createHolidaySchema, updateHolidaySchema, deleteHolidaySchema };
export default { createHolidaySchema, updateHolidaySchema, deleteHolidaySchema };

