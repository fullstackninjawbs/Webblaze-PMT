import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { ApiError } from './utils/ApiError';
import authRoutes from './modules/auth/auth.routes';
import clientRoutes from './modules/clients/client.routes';
import projectRoutes from './modules/projects/project.routes';
import userRoutes from './modules/users/user.routes';
import milestoneRoutes from './modules/milestones/milestone.routes';
import taskRoutes from './modules/tasks/task.routes';
import timeLogRoutes from './modules/timelogs/timeLog.routes';
import todoRoutes from './modules/todos/todo.routes';
import cookieParser from 'cookie-parser';

dotenv.config();

const app: Application = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/milestones', milestoneRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/timelogs', timeLogRoutes);
app.use('/api/v1/todos', todoRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// Unknown routes
app.use('*', (req: Request, _res: Response) => {
  throw new ApiError(404, `Route ${req.originalUrl} not found`);
});

// Global Error Handler
app.use(errorHandler);

export default app;
