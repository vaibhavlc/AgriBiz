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

    // Drop old non-sparse mobile index from MongoDB Atlas if it exists
    try {
      const db = conn.connection.db;
      const indexes = await db.collection('users').indexes();
      const mobileIdx = indexes.find(idx => idx.name === 'mobile_1');
      if (mobileIdx && !mobileIdx.sparse) {
        await db.collection('users').dropIndex('mobile_1');
        logger.info('Dropped old non-sparse mobile_1 index from users collection');
      }
      await db.collection('users').createIndex({ mobile: 1 }, { unique: true, sparse: true });
    } catch (idxErr) {
      logger.warn('Index sync notice: %s', idxErr.message);
    }

    return conn;
  } catch (error) {
    logger.error('MongoDB connection error: %s', error.message);
    process.exit(1);
  }
};
