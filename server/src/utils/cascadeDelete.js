/**
 * Cascade Delete Utility
 * Permanently deletes a company AND all related data across EVERY MongoDB collection.
 * Includes MongoDB Transaction support, dynamic collection discovery, and zero-orphan audit.
 */
import mongoose from 'mongoose';
import logger from '../config/logger.js';

export async function cascadeDeleteCompany(companyId) {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection unavailable.');
  }

  // 1. Discover all existing collections dynamically
  const collectionInfos = await db.listCollections().toArray();
  const allCollectionNames = collectionInfos.map(c => c.name);

  // 2. Fetch all user IDs for this company to purge refresh tokens
  let companyUserIds = [];
  try {
    const users = await db.collection('users').find({ companyId }, { projection: { userId: 1, _id: 1 } }).toArray();
    companyUserIds = users.map(u => u.userId || u._id.toString());
  } catch (e) {
    logger.warn('Could not fetch user IDs during cascade delete: %s', e.message);
  }

  // 3. Try to use a MongoDB Transaction if supported
  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (tErr) {
    logger.info('MongoDB Transactions not enabled on this deployment, executing standard cascade delete.');
    session = null;
    useTransaction = false;
  }

  const results = {};

  try {
    const opts = useTransaction && session ? { session } : {};

    // A. Delete Refresh Tokens for company users
    if (allCollectionNames.includes('refreshtokens')) {
      const tokenQuery = {
        $or: [
          { companyId },
          { userId: { $in: companyUserIds } }
        ]
      };
      const res = await db.collection('refreshtokens').deleteMany(tokenQuery, opts);
      if (res.deletedCount > 0) results['refreshtokens'] = res.deletedCount;
    }

    // B. Delete from all other collections matching companyId
    for (const colName of allCollectionNames) {
      if (colName === 'companies' || colName === 'refreshtokens') continue;

      try {
        const res = await db.collection(colName).deleteMany({ companyId }, opts);
        if (res.deletedCount > 0) {
          results[colName] = res.deletedCount;
        }
      } catch (err) {
        logger.warn(`Skip collection ${colName} during delete: ${err.message}`);
      }
    }

    // C. Delete the Company document itself (try companyId field and _id)
    if (allCollectionNames.includes('companies')) {
      const companyRes = await db.collection('companies').deleteMany({
        $or: [
          { companyId },
          { _id: companyId }
        ]
      }, opts);
      results['companies'] = companyRes.deletedCount;
    }

    // D. Final Audit Check: Verify zero documents remain for this companyId
    let orphanCount = 0;
    for (const colName of allCollectionNames) {
      if (colName === 'refreshtokens') continue;
      const count = await db.collection(colName).countDocuments({ companyId }, opts);
      if (count > 0) {
        orphanCount += count;
        logger.error(`Orphan records detected in collection ${colName}: ${count}`);
      }
    }

    if (orphanCount > 0) {
      throw new Error(`Deletion verification failed: ${orphanCount} orphan records still remain in database.`);
    }

    // Commit Transaction if active
    if (useTransaction && session) {
      await session.commitTransaction();
    }

    logger.info(`Cascade deletion complete for companyId ${companyId}. Summary: %j`, results);
    return { success: true, results };
  } catch (error) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        logger.error('Error aborting transaction: %s', abortErr.message);
      }
    }
    logger.error(`Cascade delete failed for companyId ${companyId}: ${error.message}`);
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

/**
 * Cascade delete by mobile number (looks up company first)
 */
export async function cascadeDeleteByMobile(mobile) {
  const db = mongoose.connection.db;

  const company = await db.collection('companies').findOne({ mobile });
  if (!company) {
    return { found: false };
  }

  const companyId = company.companyId || company._id.toString();
  const res = await cascadeDeleteCompany(companyId);

  return { found: true, businessName: company.businessName, companyId, results: res.results };
}
