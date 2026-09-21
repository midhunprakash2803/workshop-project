const prisma = require('../config/db');
const { validateAssetTransition } = require('../services/stateMachineService');
const { logAudit } = require('../services/auditService');
const { runOverdueCheck } = require('../services/cronService');

/**
 * POST /api/rentals/issue
 * Staff issues an approved asset to the borrower, recording pre-issue condition and photo evidence
 */
const issueAsset = async (req, res, next) => {
  try {
    const {
      requestId,
      assetId,
      borrowerId,
      dueDate,
      preCondition = 'EXCELLENT',
      preNotes,
      prePhotos
    } = req.body;

    const issuedBy = req.user.id;

    if (!assetId || !borrowerId || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Asset ID, borrower ID, and due date are required to issue an asset.'
      });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // State machine check: APPROVED -> ISSUED (or AVAILABLE -> ISSUED for direct walk-in checkout)
    if (asset.status !== 'APPROVED' && asset.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        message: `Cannot issue asset with current status '${asset.status}'. Must be APPROVED or AVAILABLE.`
      });
    }

    validateAssetTransition(asset.status === 'AVAILABLE' ? 'APPROVED' : asset.status, 'ISSUED');

    // Create the Rental record
    const rental = await prisma.rental.create({
      data: {
        requestId: requestId || null,
        assetId,
        borrowerId,
        issuedBy,
        issueDate: new Date(),
        dueDate: new Date(dueDate),
        status: 'ACTIVE',
        preCondition,
        preNotes: preNotes ? preNotes.trim() : null,
        prePhotos: typeof prePhotos === 'object' ? JSON.stringify(prePhotos) : (prePhotos || null)
      },
      include: {
        asset: true,
        borrower: { select: { id: true, name: true, email: true } },
        issuer: { select: { id: true, name: true } }
      }
    });

    // Update asset status to ISSUED
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        status: 'ISSUED',
        currentCondition: preCondition
      }
    });

    // If linked to request, update request status to APPROVED / COMPLETED
    if (requestId) {
      await prisma.rentalRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
      });
    }

    // Notify Borrower
    await prisma.notification.create({
      data: {
        userId: borrowerId,
        title: '📦 Asset Successfully Issued',
        message: `You have received "${asset.name}" (${asset.assetCode}). Due date: ${new Date(dueDate).toLocaleDateString()}. Condition: ${preCondition}.`
      }
    });

    // Audit log
    await logAudit({
      userId: req.user.id,
      action: 'ASSET_ISSUED',
      entityType: 'RENTAL',
      entityId: rental.id,
      newValue: JSON.stringify({ asset: asset.name, preCondition, dueDate }),
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Asset issued successfully with pre-issue condition recorded.',
      rental
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/rentals/:id/initiate-return
 * Borrower or Staff initiates return workflow
 */
const initiateReturn = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: { asset: true, borrower: true }
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental record not found.' });
    }

    if (!['ACTIVE', 'OVERDUE'].includes(rental.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot initiate return for rental with status '${rental.status}'.`
      });
    }

    // Validate state machine: ISSUED/OVERDUE -> RETURN_INITIATED
    validateAssetTransition(rental.asset.status, 'RETURN_INITIATED');

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: { status: 'RETURN_INITIATED' }
    });

    await prisma.asset.update({
      where: { id: rental.assetId },
      data: { status: 'RETURN_INITIATED' }
    });

    // Notify Staff
    const staffMembers = await prisma.user.findMany({
      where: { role: { in: ['STAFF', 'ADMIN'] } },
      select: { id: true }
    });

    for (const staff of staffMembers) {
      await prisma.notification.create({
        data: {
          userId: staff.id,
          title: '🔄 Return Initiated',
          message: `Return initiated for "${rental.asset.name}" (${rental.asset.assetCode}) by ${rental.borrower.name}. Awaiting digital inspection.`
        }
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'RETURN_INITIATED',
      entityType: 'RENTAL',
      entityId: id,
      oldValue: rental.status,
      newValue: 'RETURN_INITIATED',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Return initiated. Staff can now conduct digital return inspection.',
      rental: updatedRental
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rentals
 * Admin/Staff see all; Borrower sees only their own
 */
const getRentals = async (req, res, next) => {
  try {
    const { status, assetId } = req.query;
    const where = {};

    if (req.user.role === 'BORROWER') {
      where.borrowerId = req.user.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (assetId) {
      where.assetId = assetId;
    }

    const rentals = await prisma.rental.findMany({
      where,
      include: {
        asset: {
          include: { category: true }
        },
        borrower: {
          select: { id: true, name: true, email: true }
        },
        issuer: {
          select: { id: true, name: true }
        },
        conditions: {
          include: {
            receiver: { select: { id: true, name: true } }
          }
        },
        damageReports: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: rentals.length,
      rentals
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rentals/:id
 */
const getRentalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        asset: {
          include: { category: true }
        },
        borrower: {
          select: { id: true, name: true, email: true }
        },
        issuer: {
          select: { id: true, name: true }
        },
        conditions: {
          include: {
            receiver: { select: { id: true, name: true } }
          }
        },
        damageReports: true
      }
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found.' });
    }

    if (req.user.role === 'BORROWER' && rental.borrowerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this rental.' });
    }

    res.json({ success: true, rental });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rentals/check-overdue
 * Manually trigger overdue check
 */
const triggerOverdueCheck = async (req, res, next) => {
  try {
    const result = await runOverdueCheck();
    res.json({
      success: true,
      message: `Overdue check executed. ${result.updatedCount || 0} items updated.`,
      result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rentals/:id/remind
 * Send return reminder notification to borrower
 */
const sendReturnReminder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        asset: true,
        borrower: { select: { id: true, name: true, email: true } }
      }
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental record not found.' });
    }

    const dueDateStr = new Date(rental.dueDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const isOverdue = new Date(rental.dueDate) < new Date();
    const title = isOverdue ? 'URGENT: Equipment Return Overdue' : 'Equipment Return Reminder';
    const message = isOverdue
      ? `Attention ${rental.borrower.name}: ${rental.asset.name} (${rental.asset.assetCode}) was due on ${dueDateStr} and is now OVERDUE. Please return it to the staff immediately.`
      : `Friendly reminder: ${rental.asset.name} (${rental.asset.assetCode}) is scheduled for return by ${dueDateStr}. Please check-in with staff on time.`;

    await prisma.notification.create({
      data: {
        userId: rental.borrowerId,
        title,
        message
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'REMINDER_DISPATCHED',
      entityType: 'RENTAL',
      entityId: rental.id,
      newValue: `Dispatched return reminder to ${rental.borrower.email}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Return reminder successfully sent to ${rental.borrower.name}.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueAsset,
  initiateReturn,
  getRentals,
  getRentalById,
  triggerOverdueCheck,
  sendReturnReminder
};
