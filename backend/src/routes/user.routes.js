import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';
import {
  getAllUsers,
  getUserById,
  getProfile,
  updateProfile,
  createUser,
  updateUser,
} from '../controllers/user.controller.js';

const router = express.Router();

// Protected routes - require authentication
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// Admin only routes
router.get('/', authMiddleware, isAdmin, getAllUsers);
router.post('/', authMiddleware, isAdmin, createUser);
router.get('/:id', authMiddleware, isAdmin, getUserById);
router.put('/:id', authMiddleware, isAdmin, updateUser);

export default router;
