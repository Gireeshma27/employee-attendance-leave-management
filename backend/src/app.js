import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import errorHandler from './middlewares/error.middleware.js';
import ApiResponse from './utils/apiResponse.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import leaveRoutes from './routes/leave.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? config.FRONTEND_URL : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/v1/health', (req, res) => {
  ApiResponse.success(res, 200, 'API is running', {
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leaves', leaveRoutes);

// 404 Route
app.use((req, res) => {
  ApiResponse.notFound(res, 'Route not found');
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
