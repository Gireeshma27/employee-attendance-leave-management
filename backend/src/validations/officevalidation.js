import { z } from "zod";

/**
 * @description Office validation schemas.
 * @module validations/officevalidation
 */

const createOfficeSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Office name is required"),
    description: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    coords: z.array(z.number()).length(2, "Coordinates must be [lat, lng]"),
    radius: z.number().min(1, "Radius must be a positive number"),
    status: z.enum(["Active", "Inactive"]).default("Active"),
  }),
});

const updateOfficeSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    coords: z.array(z.number()).length(2).optional(),
    radius: z.number().min(1).optional(),
    status: z.enum(["Active", "Inactive"]).optional(),
  }),
});

export { createOfficeSchema, updateOfficeSchema };
export default { createOfficeSchema, updateOfficeSchema };
