import Joi from "joi";

/**
 * Validation schemas for Timing operations
 */

export const createTimingSchema = Joi.object({
  location: Joi.string()
    .valid("Mysore", "Bangalore", "Mangalore")
    .required()
    .messages({
      "any.only": "Location must be one of: Mysore, Bangalore, Mangalore",
      "any.required": "Location is required",
    }),
  branch: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Branch name is required",
    "string.max": "Branch name must be less than 100 characters",
  }),
  teamName: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "Team name is required",
    "string.max": "Team name must be less than 100 characters",
  }),
  loginTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Login time must be in HH:mm format (24-hour)",
      "any.required": "Login time is required",
    }),
  logoutTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Logout time must be in HH:mm format (24-hour)",
      "any.required": "Logout time is required",
    }),
  departments: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .required()
    .messages({
      "array.min": "At least one department must be assigned",
      "any.required": "Departments are required",
    }),
  isActive: Joi.boolean().default(true),
});

export const updateTimingSchema = Joi.object({
  location: Joi.string()
    .valid("Mysore", "Bangalore", "Mangalore")
    .messages({
      "any.only": "Location must be one of: Mysore, Bangalore, Mangalore",
    }),
  branch: Joi.string().trim().min(1).max(100).messages({
    "string.empty": "Branch name cannot be empty",
    "string.max": "Branch name must be less than 100 characters",
  }),
  teamName: Joi.string().trim().min(1).max(100).messages({
    "string.empty": "Team name cannot be empty",
    "string.max": "Team name must be less than 100 characters",
  }),
  loginTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.pattern.base": "Login time must be in HH:mm format (24-hour)",
    }),
  logoutTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.pattern.base": "Logout time must be in HH:mm format (24-hour)",
    }),
  departments: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .messages({
      "array.min": "At least one department must be assigned",
    }),
  isActive: Joi.boolean(),
}).min(1).messages({
  "object.min": "At least one field must be provided for update",
});
