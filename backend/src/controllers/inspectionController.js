const prisma = require('../config/db');
const { validateAssetTransition } = require('../services/stateMachineService');
const { logAudit } = require('../services/auditService');

/**
 * POST /api/inspections/upload
 * Upload damage/inspection evidence photos
 */
const uploadEvidencePhotos = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No photo files uploaded.' });
    }

    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);

    res.json({
      success: true,
      message: `${fileUrls.length} photo(s) uploaded successfully.`,
      photoUrls: fileUrls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/inspections/inspect
 * Staff records post-return digital inspection, triggers damage report if applicable,
 * and executes state machine transition to VERIFIED -> AVAILABLE or DAMAGED -> MAINTENANCE.
 */
const submitReturnInspection = async (req, res, next) => {
  try {
    const {
      rentalId,
      condition, // 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'
      remarks,
      photoUrls, // Array of URLs or JSON string
      damageDescription,
      damageSeverity = 'MEDIUM' // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    } = req.body;

    const receivedBy = req.user.id;

    if (!rentalId || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Rental ID and return condition are required.'
      });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { asset: true, borrower: true }
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental not found.' });
    }

    if (rental.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'This rental has already been inspected and completed.' });
    }

    // Format photos
    const formattedPhotos = Array.isArray(photoUrls)
      ? JSON.stringify(photoUrls)
      : (typeof photoUrls === 'string' ? photoUrls : null);

    // 1. Create Return / Inspection record
    const conditionRecord = await prisma.assetCondition.create({
      data: {
        rentalId,
        receivedBy,
        condition,
        remarks: remarks ? remarks.trim() : null,
        photoUrls: formattedPhotos
      }
    });

    const isDamaged = condition === 'DAMAGED' || Boolean(damageDescription && damageDescription.trim());

    let damageReport = null;
    let maintenanceRecord = null;
    let nextAssetStatus = 'AVAILABLE';

    if (isDamaged) {
      // Transition path: INSPECTION -> DAMAGED -> MAINTENANCE
      nextAssetStatus = 'MAINTENANCE';

      // Create damage report
      damageReport = await prisma.damageReport.create({
        data: {
          assetId: rental.assetId,
          rentalId: rental.id,
          reportedBy: receivedBy,
          description: damageDescription ? damageDescription.trim() : (remarks || 'Asset returned in damaged condition.'),
          severity: damageSeverity,
          status: 'OPEN'
        }
      });

      // Automatically create maintenance ticket
      maintenanceRecord = await prisma.maintenance.create({
        data: {
          assetId: rental.assetId,
          damageReportId: damageReport.id,
          description: `Auto-generated maintenance ticket for inspection damage: ${damageDescription || remarks || 'Damaged return'}`,
          maintenanceStatus: 'SCHEDULED'
        }
      });

      // Update asset condition to DAMAGED and status to MAINTENANCE
      await prisma.asset.update({
        where: { id: rental.assetId },
        data: {
          currentCondition: 'DAMAGED',
          status: 'MAINTENANCE'
        }
      });

      // Notify Borrower about damage finding
      await prisma.notification.create({
        data: {
          userId: rental.borrowerId,
          title: '🚨 Asset Return Inspection Notice: Damage Detected',
          message: `During inspection of "${rental.asset.name}", damage was documented (${damageSeverity} severity). Staff remarks: "${remarks || damageDescription}". A damage report (#${damageReport.id.slice(0, 8)}) was generated.`
        }
      });

      // Notify Admins
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      for (const a of admins) {
        await prisma.notification.create({
          data: {
            userId: a.id,
            title: '🛠️ New Asset Damage & Maintenance Logged',
            message: `Asset "${rental.asset.name}" (${rental.asset.assetCode}) was marked as DAMAGED during return inspection. Maintenance scheduled.`
          }
        });
      }
    } else {
      // Normal Return path: INSPECTION -> VERIFIED -> AVAILABLE
      await prisma.asset.update({
        where: { id: rental.assetId },
        data: {
          currentCondition: condition,
          status: 'AVAILABLE'
        }
      });

      // Notify Borrower about clear return
      await prisma.notification.create({
        data: {
          userId: rental.borrowerId,
          title: '✅ Rental Completed & Verified',
          message: `Return inspection for "${rental.asset.name}" completed successfully with condition "${condition}". Thank you for your accountability!`
        }
      });
    }

    // 2. Mark Rental as COMPLETED
    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: 'COMPLETED',
        returnedAt: new Date()
      }
    });

    // 3. Audit Log
    await logAudit({
      userId: req.user.id,
      action: isDamaged ? 'RETURN_INSPECTED_DAMAGED' : 'RETURN_INSPECTED_VERIFIED',
      entityType: 'RENTAL',
      entityId: rental.id,
      oldValue: JSON.stringify({ preCondition: rental.preCondition, assetStatus: rental.asset.status }),
      newValue: JSON.stringify({
        postCondition: condition,
        assetStatus: nextAssetStatus,
        isDamaged,
        damageReportId: damageReport?.id || null
      }),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: isDamaged
        ? 'Digital return inspection completed. Damage reported and asset queued for maintenance.'
        : 'Digital return inspection completed. Asset verified and returned to AVAILABLE pool.',
      inspection: conditionRecord,
      damageReport,
      maintenance: maintenanceRecord,
      rental: updatedRental
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/inspections/comparison/:rentalId
 * Returns side-by-side pre-issue vs post-return data
 */
const getInspectionComparison = async (req, res, next) => {
  try {
    const { rentalId } = req.params;

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        asset: { include: { category: true } },
        borrower: { select: { id: true, name: true, email: true } },
        issuer: { select: { id: true, name: true } },
        conditions: {
          include: {
            receiver: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        damageReports: true
      }
    });

    if (!rental) {
      return res.status(404).json({ success: false, message: 'Rental record not found.' });
    }

    const postReturnRecord = rental.conditions[0] || null;

    // Helper to safely parse JSON strings
    const safeParse = (str) => {
      if (!str) return [];
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [str];
      }
    };

    const comparison = {
      rentalId: rental.id,
      asset: {
        id: rental.asset.id,
        name: rental.asset.name,
        code: rental.asset.assetCode,
        category: rental.asset.category.name,
        imageUrl: rental.asset.imageUrl
      },
      borrower: rental.borrower,
      dates: {
        issueDate: rental.issueDate,
        dueDate: rental.dueDate,
        returnedAt: rental.returnedAt
      },
      preIssue: {
        condition: rental.preCondition,
        notes: rental.preNotes || 'No initial notes.',
        photos: safeParse(rental.prePhotos),
        inspector: rental.issuer
      },
      postReturn: postReturnRecord ? {
        condition: postReturnRecord.condition,
        remarks: postReturnRecord.remarks || 'No return remarks.',
        photos: safeParse(postReturnRecord.photoUrls),
        inspector: postReturnRecord.receiver,
        inspectedAt: postReturnRecord.createdAt
      } : null,
      isDamaged: rental.damageReports.length > 0 || (postReturnRecord?.condition === 'DAMAGED'),
      damageReport: rental.damageReports[0] || null
    };

    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadEvidencePhotos,
  submitReturnInspection,
  getInspectionComparison
};
