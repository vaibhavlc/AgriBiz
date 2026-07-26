import mongoose from 'mongoose';
import dns from 'dns';
import logger from '../config/logger.js';

export const connectDB = async () => {
  try {
    try {
      dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
      logger.info('DNS servers configured to public resolvers for SRV lookup');
    } catch (dnsErr) {
      logger.warn('Failed to set public DNS resolvers, falling back: %s', dnsErr.message);
    }

    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agribiz';
    logger.info('Connecting to MongoDB...');
    const conn = await mongoose.connect(connStr);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error: %s', error.message);
    process.exit(1);
  }
};
