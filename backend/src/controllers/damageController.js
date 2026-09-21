const prisma = require('../config/db');
const { logAudit } = require('../services/auditService');

/**
 * GET /api/damage
 */
const getAllDamageReports = async (req, res, next) => {
  try {
    const { status, severity, assetId } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    if (assetId) {
      where.assetId = assetId;
    }

    const reports = await prisma.damageReport.findMany({
      where,
      include: {
        asset: { include: { category: true } },
        rental: {
          include: {
            borrower: { select: { id: true, name: true, email: true } }
          }
        },
        reporter: { select: { id: true, name: true, role: true } },
        maintenance: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/damage
 */
const createDamageReport = async (req, res, next) => {
  try {
    const { assetId, rentalId, description, severity = 'MEDIUM' } = req.body;

    if (!assetId || !description) {
      return res.status(400).json({ success: false, message: 'Asset ID and damage description are required.' });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const report = await prisma.damageReport.create({
      data: {
        assetId,
        rentalId: rentalId || null,
        reportedBy: req.user.id,
        description: description.trim(),
        severity,
        status: 'OPEN'
      },
      include: {
        asset: true
      }
    });

    // Update asset condition to DAMAGED
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        currentCondition: 'DAMAGED',
        status: 'MAINTENANCE'
      }
    });

    // Create corresponding maintenance entry
    await prisma.maintenance.create({
      data: {
        assetId,
        damageReportId: report.id,
        description: `Repair order for damage report: ${description.trim()}`,
        maintenanceStatus: 'SCHEDULED'
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'DAMAGE_REPORT_CREATED',
      entityType: 'DAMAGE_REPORT',
      entityId: report.id,
      newValue: JSON.stringify({ asset: asset.name, severity, description }),
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Damage report created and asset placed in maintenance queue.',
      report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/damage/:id
 */
const updateDamageReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, severity, description } = req.body;

    const report = await prisma.damageReport.findUnique({ where: { id } });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Damage report not found.' });
    }

    const updated = await prisma.damageReport.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(severity && { severity }),
        ...(description && { description: description.trim() })
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'DAMAGE_REPORT_UPDATED',
      entityType: 'DAMAGE_REPORT',
      entityId: id,
      oldValue: report.status,
      newValue: updated.status,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Damage report updated.', report: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDamageReports,
  createDamageReport,
  updateDamageReport
};
