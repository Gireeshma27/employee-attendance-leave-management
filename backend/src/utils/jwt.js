import jwt from "jsonwebtoken";
import env from "#config/env";

/**
 * @description JWT utility for token generation and verification.
 * @module utils/jwt
 */

/**
 * Generates a JWT for a user.
 * @param {string} userId - User ID to encode.
 * @param {string} email - User email to encode.
 * @param {string} role - User role to encode.
 * @returns {string} Signed JWT.
 */
export const generateToken = (userId, email, role) => {
  return jwt.sign({ id: userId, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT.
 * @param {string} token - Token to verify.
 * @returns {Object} Decoded token payload.
 * @throws {Error} If verification fails.
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Decodes a JWT without verification.
 * @param {string} token - Token to decode.
 * @returns {Object|null} Decoded payload or null if invalid.
 */
export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

export default { generateToken, verifyToken, decodeToken };
