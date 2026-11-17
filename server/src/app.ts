import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { ApiError } from './utils/ApiError';
import authRoutes from './modules/auth/auth.routes';
import clientRoutes from './modules/clients/client.routes';
import projectRoutes from './modules/projects/project.routes';
import userRoutes from './modules/users/user.routes';
import milestoneRoutes from './modules/milestones/milestone.routes';
import taskRoutes from './modules/tasks/task.routes';
import timeLogRoutes from './modules/timelogs/timeLog.routes';
import releaseRoutes from './modules/releases/release.routes';
import invoiceRoutes from './modules/invoices/invoice.routes';
import dailyStatusRoutes from './modules/daily-status/dailyStatus.routes';
import uploadRoutes from './modules/uploads/upload.routes';
import { proposalRoutes } from './modules/proposals/proposal.routes';
import cookieParser from 'cookie-parser';
import { sanitizeRequest } from './middlewares/sanitize.middleware';

dotenv.config();

const app: Application = express();

/**
 * Client IP for rate limiting comes from X-Forwarded-For only when the request arrives
 * through a trusted proxy. Default 'loopback' trusts an nginx on the same machine.
 * Set TRUST_PROXY to a hop count (e.g. 1) on Vercel or behind a load balancer.
 */
const trustProxy = process.env.TRUST_PROXY ?? 'loopback';
app.set('trust proxy', /^[0-9]+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === 'true' ? true : trustProxy === 'false' ? false : trustProxy);

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false }));

/**
 * Only the configured frontends may call the API with credentials. Otherwise any website
 * a logged-in user visits could call /auth/refresh and read back a fresh access token.
 *   CLIENT_URL    - the main frontend origin
 *   CORS_ORIGINS  - optional extra origins, comma-separated
 * Local dev origins are allowed only outside production.
 */
const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, '').toLowerCase();
const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL,
    ...(process.env.CORS_ORIGINS || '').split(','),
    ...(process.env.NODE_ENV === 'production'
      ? []
      : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173']),
  ]
    .filter((o): o is string => !!o && o.trim() !== '')
    .map(normalizeOrigin)
);

app.use(cors({
  origin: (origin, callback) => {
    // No Origin header: same-origin requests, curl, server-to-server. CORS does not apply.
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(normalizeOrigin(origin))) return callback(null, true);
    // Not allowed: respond without CORS headers so the browser blocks the response
    return callback(null, false);
  },
  credentials: true
}));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Strip Mongo operator keys ($set, $ne, ...) from every body and query string
app.use(sanitizeRequest);

// Ensure uploads folder exists (safely handled for Vercel serverless read-only filesystem)
try {
  const uploadsDir = path.join(__dirname, '../public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  // Uploaded files can never run as a web page on this origin: a sandbox CSP blocks
  // scripts even in files uploaded before type checks existed, and anything that is
  // not an image downloads instead of opening in the browser.
  app.use('/uploads', express.static(uploadsDir, {
    dotfiles: 'deny',
    index: false,
    setHeaders: (res, filePath) => {
      res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (!/\.(png|jpe?g|gif|webp)$/i.test(filePath)) {
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
      }
    },
  }));
} catch (e) {
  // Read-only filesystem context on Vercel
}

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/milestones', milestoneRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/timelogs', timeLogRoutes);
app.use('/api/v1/releases', releaseRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/daily-status', dailyStatusRoutes);
app.use('/api/v1/proposals', proposalRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// Health Check
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// Unknown routes
app.use('*', (req: Request, _res: Response) => {
  throw new ApiError(404, `Route ${req.originalUrl} not found`);
});

// Global Error Handler
app.use(errorHandler);

export default app;
