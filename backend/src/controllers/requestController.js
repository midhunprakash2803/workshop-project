const prisma = require('../config/db');
const { checkAssetAvailability } = require('../services/availabilityService');
const { validateAssetTransition } = require('../services/stateMachineService');
const { logAudit } = require('../services/auditService');

/**
 * POST /api/requests
 * Borrower submits a rental request
 */
const createRequest = async (req, res, next) => {
  try {
    const { assetId, startDate, dueDate, purpose } = req.body;
    const borrowerId = req.user.id;

    if (!assetId || !startDate || !dueDate || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Asset ID, start date, due date, and rental purpose are required.'
      });
    }

    // Check availability algorithm: (requested_start < existing_end) AND (requested_end > existing_start)
    const availability = await checkAssetAvailability(assetId, startDate, dueDate);
    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: `Asset is unavailable: ${availability.reason}`,
        conflict: availability.conflict
      });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // Validate state machine: AVAILABLE -> REQUESTED
    if (asset.status === 'AVAILABLE') {
      validateAssetTransition(asset.status, 'REQUESTED');
    }

    const request = await prisma.rentalRequest.create({
      data: {
        assetId,
        borrowerId,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        purpose: purpose.trim(),
        status: 'PENDING'
      },
      include: {
        asset: true,
        borrower: { select: { id: true, name: true, email: true } }
      }
    });

    // Update asset status to REQUESTED
    await prisma.asset.update({
      where: { id: assetId },
      data: { status: 'REQUESTED' }
    });

    // Notify Admins & Staff
    const adminsAndStaff = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] } },
      select: { id: true }
    });

    for (const u of adminsAndStaff) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          title: '📋 New Rental Request',
          message: `${req.user.name} requested to rent "${asset.name}" (${asset.assetCode}).`
        }
      });
    }

    // Audit log
    await logAudit({
      userId: req.user.id,
      action: 'RENTAL_REQUEST_SUBMITTED',
      entityType: 'RENTAL_REQUEST',
      entityId: request.id,
      newValue: JSON.stringify({ asset: asset.name, start: startDate, due: dueDate }),
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Rental request submitted successfully.',
      request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests
 * Admin & Staff see all; Borrower sees their own
 */
const getRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};

    if (req.user.role === 'BORROWER') {
      where.borrowerId = req.user.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const requests = await prisma.rentalRequest.findMany({
      where,
      include: {
        asset: {
          include: { category: true }
        },
        borrower: {
          select: { id: true, name: true, email: true }
        },
        approver: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/requests/:id/approve
 * Admin only
 */
const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.rentalRequest.findUnique({
      where: { id },
      include: { asset: true, borrower: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Rental request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status '${request.status}'.`
      });
    }

    // Validate state machine: REQUESTED -> APPROVED
    validateAssetTransition(request.asset.status, 'APPROVED');

    // Update request to APPROVED
    const updatedRequest = await prisma.rentalRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user.id
      }
    });

    // Update asset status to APPROVED
    await prisma.asset.update({
      where: { id: request.assetId },
      data: { status: 'APPROVED' }
    });

    // Notify Borrower
    await prisma.notification.create({
      data: {
        userId: request.borrowerId,
        title: '🎉 Rental Request Approved!',
        message: `Your request for "${request.asset.name}" (${request.asset.assetCode}) was approved. You may now pick up the item from Staff.`
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'RENTAL_REQUEST_APPROVED',
      entityType: 'RENTAL_REQUEST',
      entityId: id,
      oldValue: 'PENDING',
      newValue: 'APPROVED',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Rental request approved successfully.',
      request: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/requests/:id/reject
 * Admin only
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const request = await prisma.rentalRequest.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Rental request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status '${request.status}'.`
      });
    }

    // Update request to REJECTED
    const updatedRequest = await prisma.rentalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: req.user.id,
        rejectionReason: rejectionReason ? rejectionReason.trim() : 'Request declined by administrator.'
      }
    });

    // Restore asset status to AVAILABLE
    await prisma.asset.update({
      where: { id: request.assetId },
      data: { status: 'AVAILABLE' }
    });

    // Notify borrower
    await prisma.notification.create({
      data: {
        userId: request.borrowerId,
        title: '❌ Rental Request Declined',
        message: `Your request for "${request.asset.name}" was declined. Reason: ${rejectionReason || 'Declined by administrator.'}`
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'RENTAL_REQUEST_REJECTED',
      entityType: 'RENTAL_REQUEST',
      entityId: id,
      oldValue: 'PENDING',
      newValue: 'REJECTED',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Rental request rejected.',
      request: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/requests/:id/cancel
 * Borrower or Admin
 */
const cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.rentalRequest.findUnique({
      where: { id },
      include: { asset: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Rental request not found.' });
    }

    if (req.user.role === 'BORROWER' && request.borrowerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this request.' });
    }

    if (!['PENDING', 'APPROVED'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a request that is already '${request.status}'.`
      });
    }

    const updatedRequest = await prisma.rentalRequest.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Restore asset to AVAILABLE
    await prisma.asset.update({
      where: { id: request.assetId },
      data: { status: 'AVAILABLE' }
    });

    await logAudit({
      userId: req.user.id,
      action: 'RENTAL_REQUEST_CANCELLED',
      entityType: 'RENTAL_REQUEST',
      entityId: id,
      oldValue: request.status,
      newValue: 'CANCELLED',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Rental request cancelled.',
      request: updatedRequest
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  approveRequest,
  rejectRequest,
  cancelRequest
};
