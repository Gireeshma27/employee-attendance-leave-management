import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import { isManager } from '../middlewares/role.middleware.js';
import {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
} from '../controllers/leave.controller.js';

const router = express.Router();

// Protected routes - require authentication
router.post('/apply', authMiddleware, applyLeave);
router.get('/my', authMiddleware, getMyLeaves);
router.delete('/:leaveId', authMiddleware, cancelLeave);

// Manager and admin routes
router.get('/pending', authMiddleware, isManager, getPendingLeaves);
router.put('/:leaveId/approve', authMiddleware, isManager, approveLeave);
router.put('/:leaveId/reject', authMiddleware, isManager, rejectLeave);

export default router;
