/**
 * Asset Lifecycle State Machine Engine
 * 
 * Strict Transitions:
 * AVAILABLE -> REQUESTED -> APPROVED -> ISSUED -> RETURN_INITIATED -> INSPECTION -> VERIFIED -> AVAILABLE
 * (Damage path: INSPECTION -> DAMAGED -> MAINTENANCE -> AVAILABLE)
 * (Alternate branches: REQUESTED -> REJECTED -> AVAILABLE, REQUESTED -> CANCELLED -> AVAILABLE, ISSUED -> OVERDUE)
 */

const VALID_TRANSITIONS = {
  AVAILABLE: ['REQUESTED'],
  REQUESTED: ['APPROVED', 'REJECTED', 'CANCELLED', 'AVAILABLE'],
  APPROVED: ['ISSUED', 'CANCELLED', 'AVAILABLE'],
  ISSUED: ['RETURN_INITIATED', 'INSPECTION', 'OVERDUE'],
  OVERDUE: ['RETURN_INITIATED', 'INSPECTION'],
  RETURN_INITIATED: ['INSPECTION'],
  INSPECTION: ['VERIFIED', 'DAMAGED', 'AVAILABLE'],
  VERIFIED: ['AVAILABLE'],
  DAMAGED: ['MAINTENANCE'],
  MAINTENANCE: ['AVAILABLE', 'DAMAGED'],
  REJECTED: ['AVAILABLE'],
  CANCELLED: ['AVAILABLE']
};

/**
 * Validates if an asset state transition is legal
 * @param {string} currentStatus 
 * @param {string} nextStatus 
 * @returns {boolean}
 */
const canTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return true;
  const allowed = VALID_TRANSITIONS[currentStatus];
  return Boolean(allowed && allowed.includes(nextStatus));
};

/**
 * Asserts transition validity or throws a descriptive 400 error
 * @param {string} currentStatus 
 * @param {string} nextStatus 
 */
const validateAssetTransition = (currentStatus, nextStatus) => {
  if (!canTransition(currentStatus, nextStatus)) {
    const error = new Error(
      `Invalid state transition: Cannot change asset status from '${currentStatus}' to '${nextStatus}'. ` +
      `Allowed transitions from '${currentStatus}' are: [${(VALID_TRANSITIONS[currentStatus] || []).join(', ')}]`
    );
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  VALID_TRANSITIONS,
  canTransition,
  validateAssetTransition
};
