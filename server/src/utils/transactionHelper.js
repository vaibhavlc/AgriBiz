import mongoose from 'mongoose';
import logger from '../config/logger.js';

/**
 * Runs a set of database operations inside a single MongoDB transaction session.
 * Automatically falls back to non-transactional execution if MongoDB does not
 * support sessions (standalone mode).
 * 
 * @param {Function} workFn - Function to execute, receives the Mongoose session object.
 * @returns {Promise<any>} The result of workFn.
 */
export const runInTransaction = async (workFn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
  } catch (sessionErr) {
    logger.warn('Mongoose session initialization skipped/unsupported (%s). Executing non-transactionally.', sessionErr.message);
    return workFn(null);
  }

  try {
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        logger.warn('Transaction abort notification: %s', abortErr.message);
      }
    }

    const isTransactionUnsupported =
      err.code === 20 ||
      err.code === 263 ||
      /transaction|replica set|mongos|session/i.test(err.message || '');

    if (isTransactionUnsupported) {
      logger.warn('MongoDB transaction failed due to unsupported standalone/session error (%s). Executing non-transactionally.', err.message);
      return workFn(null);
    }

    throw err;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (endErr) {}
    }
  }
};
