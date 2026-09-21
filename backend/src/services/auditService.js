const prisma = require('../config/db');

/**
 * Log an audit trail entry
 * 
 * @param {object} params
 * @param {string} [params.userId]
 * @param {string} params.action (e.g. 'RENTAL_ISSUED', 'ASSET_CREATED', 'STATUS_CHANGE')
 * @param {string} params.entityType (e.g. 'ASSET', 'RENTAL', 'REQUEST', 'MAINTENANCE')
 * @param {string} [params.entityId]
 * @param {any} [params.oldValue]
 * @param {any} [params.newValue]
 * @param {string} [params.ipAddress]
 */
const logAudit = async ({
  userId = null,
  action,
  entityType,
  entityId = null,
  oldValue = null,
  newValue = null,
  ipAddress = null
}) => {
  try {
    const formattedOldValue = typeof oldValue === 'object' && oldValue !== null ? JSON.stringify(oldValue) : (oldValue !== null ? String(oldValue) : null);
    const formattedNewValue = typeof newValue === 'object' && newValue !== null ? JSON.stringify(newValue) : (newValue !== null ? String(newValue) : null);

    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        oldValue: formattedOldValue,
        newValue: formattedNewValue,
        ipAddress
      }
    });
  } catch (error) {
    console.error('⚠️ Failed to write audit log:', error.message);
    return null;
  }
};

module.exports = {
  logAudit
};
