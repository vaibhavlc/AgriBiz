import logger from '../config/logger.js';

// Map of companyId -> Set of express res stream objects
const companyClients = new Map();

export const addSseClient = (companyId, res) => {
  if (!companyId) return;
  if (!companyClients.has(companyId)) {
    companyClients.set(companyId, new Set());
  }
  companyClients.get(companyId).add(res);
  logger.info('SSE Client connected for company %s (Total active: %d)', companyId, companyClients.get(companyId).size);
};

export const removeSseClient = (companyId, res) => {
  if (companyClients.has(companyId)) {
    const clients = companyClients.get(companyId);
    clients.delete(res);
    if (clients.size === 0) {
      companyClients.delete(companyId);
    }
  }
};

export const notifyCompanyClients = (companyId, data = { type: 'DATA_CHANGED' }) => {
  if (!companyId || !companyClients.has(companyId)) return;
  const clients = companyClients.get(companyId);
  const payload = `data: ${JSON.stringify({ ...data, timestamp: Date.now() })}\n\n`;
  for (const clientRes of clients) {
    try {
      clientRes.write(payload);
    } catch (err) {
      logger.error('Failed to write SSE stream payload for company %s: %s', companyId, err.message);
    }
  }
};
