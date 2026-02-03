import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

export default { generateToken, verifyToken, decodeToken };
