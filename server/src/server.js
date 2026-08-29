import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config explicitly from server/.env and root .env regardless of working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import http from 'http';
import logger from './config/logger.js';
import { initSocket } from './config/socket.js';
import { connectDB } from './database/connection.js';
import authService from './services/authService.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import recycleBinRoutes from './routes/recycleBinRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

import emailService from './services/emailService.js';

// Connect to Database & Seed Demo Data
const initApp = async () => {
  try {
    await connectDB();
    await authService.seedDemoData();
    await emailService.verifySmtpConfig();
    server.listen(PORT, () => {
      logger.info(`AgriBiz Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to initialize app: %s', err.message);
    process.exit(1);
  }
};


// Morgan request logging mapped to Winston logger
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));

// Security Headers
app.use(helmet());

// Cookie Parser
app.use(cookieParser());

// Health Check Endpoints for Cloud Deployment (Northflank/Render/Health Monitors)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.status(200).json({ name: 'AgriBiz API Gateway', status: 'Running' });
});

// CORS configuration (allow requests from localhost and production frontend URLs)
const envOrigins = [process.env.CLIENT_URL, process.env.CORS_ORIGIN]
  .filter(Boolean)
  .flatMap(url => url.split(',').map(u => u.trim()));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...envOrigins
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['*'],
  })
);

// Rate Limiting (prevent brute force / DDoS in production; skipped during development/testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 2000 : 50000,
  skip: () => process.env.NODE_ENV !== 'production',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/', limiter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// No-Cache Headers for all API responses to ensure real-time multi-device sync
app.use('/api/', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/settings/backup', backupRoutes);
app.use('/api/v1/recycle-bin', recycleBinRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/users', userRoutes);

// ── Admin Utility: Cascade Delete Company by Mobile (protected by secret key) ──
import { cascadeDeleteByMobile } from './utils/cascadeDelete.js';
app.delete('/api/admin/company/:mobile', async (req, res) => {
  const secret = process.env.ADMIN_SECRET || 'agribiz-admin-2024';
  if (req.headers['x-admin-key'] !== secret) {
    return res.status(403).json({ success: false, message: 'Forbidden: invalid admin key.' });
  }
  try {
    const result = await cascadeDeleteByMobile(req.params.mobile);
    if (!result.found) {
      return res.json({ success: false, message: `No company found with mobile ${req.params.mobile}` });
    }
    logger.info('Admin cascade-deleted company %s (%s)', result.businessName, result.companyId);
    res.json({ success: true, message: `Deleted "${result.businessName}" and ALL related data.`, details: result.results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Catch-all route (404)
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// Centralized error handler
app.use(errorHandler);

// Start server with Socket.IO support
const server = http.createServer(app);
initSocket(server);

initApp();

