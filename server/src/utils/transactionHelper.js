import mongoose from 'mongoose';

/**
 * Runs a set of database operations inside a transaction session.
 * Automatically falls back to non-transactional execution if the MongoDB 
 * server is a standalone instance that doesn't support replica set transactions.
 * 
 * @param {Function} workFn - Function to execute, receives the Mongoose session object.
 * @returns {Promise<any>} The result of workFn.
 */
export const runInTransaction = async (workFn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    
    const result = await workFn(session);
    
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Suppress session abort errors if the transaction was already closed or invalid
      }
      session.endSession();
    }
    
    // Check if the error is due to transactions not being supported (e.g. standalone instance)
    const isStandaloneError = 
      err.code === 20 || // TransactionSystemFailed
      err.code === 263 || // OperationNotSupportedInTransaction
      err.message?.includes('replica set') || 
      err.message?.includes('transaction') ||
      err.message?.includes('Session');
      
    if (isStandaloneError) {
      console.warn('MongoDB environment does not support transactions (likely running standalone). Falling back to non-transactional execution.');
      // Execute the work function without any transaction session
      return workFn(null);
    }
    
    throw err;
  } finally {
    if (session && session.session) {
      session.endSession();
    }
  }
};
