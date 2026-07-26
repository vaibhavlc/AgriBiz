import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Load config
dotenv.config();

import logger from './config/logger.js';
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
import recycleBinRoutes from './routes/recycleBinRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middlewares/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database & Seed Demo Data
const initApp = async () => {
  await connectDB();
  await authService.seedDemoData();
};

initApp();

// Morgan request logging mapped to Winston logger
const morganStream = {
  write: (message) => logger.info(message.trim()),
};
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream: morganStream }));

// Security Headers
app.use(helmet());

// Cookie Parser
app.use(cookieParser());

// CORS configuration (allow requests from frontend)
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate Limiting (prevent brute force / DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api/', limiter);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/v1/recycle-bin', recycleBinRoutes);
app.use('/api/v1/sync', syncRoutes);
app.use('/api/v1/users', userRoutes);

// Catch-all route (404)
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`AgriBiz Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
