import mongoose from 'mongoose';

/**
 * Runs a set of database operations inside a transaction session.
 * Automatically falls back to non-transactional execution if transaction
 * fails or if the MongoDB server is a standalone instance without replica sets.
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
        // Suppress abort errors if session closed
      }
    }

    // If error is 404 or expected validation/business logic error, rethrow directly
    if (err.statusCode === 404 || err.message?.includes('not found')) {
      throw err;
    }
    
    // Fall back to non-transactional execution if transaction fails on Render / standalone / Atlas
    console.warn('Transaction execution failed (%s). Retrying without transaction session...', err.message);
    try {
      return await workFn(null);
    } catch (fallbackErr) {
      throw fallbackErr;
    }
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (endErr) {}
    }
  }
};
