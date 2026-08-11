import Company from '../models/Company.js';
import logger from '../config/logger.js';
import { emitDataChange } from '../config/socket.js';

export const touchCompanyData = (
  companyId,
  senderSocketId = null,
  module = 'General',
  action = 'UPDATE',
  recordId = null,
  record = null
) => {
  if (!companyId) return;
  const t_commit = performance.now();

  // Async non-blocking touch of lastDataUpdated timestamp in MongoDB Atlas
  Company.updateOne({ companyId }, { $set: { lastDataUpdated: new Date() } }).catch(err => {
    logger.error('Failed to touch company lastDataUpdated for company %s: %s', companyId, err.message);
  });

  // Zero-delay Socket.IO emission with actual payload record
  emitDataChange({ companyId, module, action, recordId, record, senderSocketId });
  const t_emit = performance.now();
  logger.info('[PERF] MongoDB commit -> Socket.IO emit: %s ms', (t_emit - t_commit).toFixed(3));
};
