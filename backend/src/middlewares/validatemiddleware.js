import { sendError } from "#utils/api_response_fix";

/**
 * @description Higher-order middleware to validate requests using Zod schemas.
 * @param {z.ZodSchema} schema - Zod schema to validate against.
 * @returns {Function} Express middleware function.
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    next(error); // Pass to global error handler
  }
};

export default validate;
export { validate };
