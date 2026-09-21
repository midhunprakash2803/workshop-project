const prisma = require('../config/db');

/**
 * Check if an asset is available for the given date range.
 * Algorithm: Asset is unavailable if (requested_start < existing_end) AND (requested_end > existing_start)
 * 
 * @param {string} assetId 
 * @param {Date|string} requestedStart 
 * @param {Date|string} requestedEnd 
 * @param {string} [excludeRequestId] Optional request ID to exclude when updating an existing request
 * @returns {Promise<{ available: boolean, reason?: string, conflict?: object }>}
 */
const checkAssetAvailability = async (assetId, requestedStart, requestedEnd, excludeRequestId = null) => {
  const reqStart = new Date(requestedStart);
  const reqEnd = new Date(requestedEnd);

  if (isNaN(reqStart.getTime()) || isNaN(reqEnd.getTime())) {
    throw new Error('Invalid start or due date provided.');
  }

  if (reqStart >= reqEnd) {
    return {
      available: false,
      reason: 'Requested start date must be before due date.'
    };
  }

  // 1. Check current asset status
  const asset = await prisma.asset.findUnique({
    where: { id: assetId }
  });

  if (!asset) {
    return { available: false, reason: 'Asset not found.' };
  }

  if (asset.status === 'DAMAGED' || asset.status === 'MAINTENANCE') {
    return {
      available: false,
      reason: `Asset is currently ${asset.status} and cannot be scheduled for rentals.`
    };
  }

  // 2. Check overlapping active or scheduled rentals
  // Condition: (requested_start < existing_end) AND (requested_end > existing_start)
  const conflictingRentals = await prisma.rental.findMany({
    where: {
      assetId,
      status: {
        in: ['ACTIVE', 'OVERDUE', 'RETURN_INITIATED', 'INSPECTION']
      },
      AND: [
        { issueDate: { lt: reqEnd } },
        { dueDate: { gt: reqStart } }
      ]
    },
    include: {
      borrower: { select: { id: true, name: true, email: true } }
    }
  });

  if (conflictingRentals.length > 0) {
    const conflict = conflictingRentals[0];
    return {
      available: false,
      reason: `Asset is already rented out from ${conflict.issueDate.toISOString().split('T')[0]} to ${conflict.dueDate.toISOString().split('T')[0]}.`,
      conflict: {
        type: 'RENTAL',
        id: conflict.id,
        startDate: conflict.issueDate,
        dueDate: conflict.dueDate,
        borrowerName: conflict.borrower?.name
      }
    };
  }

  // 3. Check approved future rental requests that haven't been issued yet
  const requestWhere = {
    assetId,
    status: 'APPROVED',
    AND: [
      { startDate: { lt: reqEnd } },
      { dueDate: { gt: reqStart } }
    ]
  };

  if (excludeRequestId) {
    requestWhere.id = { not: excludeRequestId };
  }

  const conflictingRequests = await prisma.rentalRequest.findMany({
    where: requestWhere,
    include: {
      borrower: { select: { id: true, name: true, email: true } }
    }
  });

  if (conflictingRequests.length > 0) {
    const conflict = conflictingRequests[0];
    return {
      available: false,
      reason: `Asset has an already approved reservation from ${conflict.startDate.toISOString().split('T')[0]} to ${conflict.dueDate.toISOString().split('T')[0]}.`,
      conflict: {
        type: 'APPROVED_REQUEST',
        id: conflict.id,
        startDate: conflict.startDate,
        dueDate: conflict.dueDate,
        borrowerName: conflict.borrower?.name
      }
    };
  }

  return { available: true };
};

module.exports = {
  checkAssetAvailability
};
