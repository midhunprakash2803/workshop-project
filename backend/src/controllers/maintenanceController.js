const prisma = require('../config/db');
const { validateAssetTransition } = require('../services/stateMachineService');
const { logAudit } = require('../services/auditService');

/**
 * GET /api/maintenance
 */
const getAllMaintenance = async (req, res, next) => {
  try {
    const { status, assetId } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.maintenanceStatus = status;
    }

    if (assetId) {
      where.assetId = assetId;
    }

    const records = await prisma.maintenance.findMany({
      where,
      include: {
        asset: { include: { category: true } },
        damageReport: {
          include: {
            reporter: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: records.length, records });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/maintenance
 */
const createMaintenanceRecord = async (req, res, next) => {
  try {
    const { assetId, description, cost = 0, damageReportId } = req.body;

    if (!assetId || !description) {
      return res.status(400).json({ success: false, message: 'Asset ID and description are required.' });
    }

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const record = await prisma.maintenance.create({
      data: {
        assetId,
        damageReportId: damageReportId || null,
        description: description.trim(),
        cost: parseFloat(cost) || 0.0,
        maintenanceStatus: 'SCHEDULED',
        startedAt: new Date()
      },
      include: { asset: true }
    });

    // Update asset status to MAINTENANCE if not already
    if (asset.status !== 'MAINTENANCE') {
      await prisma.asset.update({
        where: { id: assetId },
        data: { status: 'MAINTENANCE' }
      });
    }

    await logAudit({
      userId: req.user.id,
      action: 'MAINTENANCE_CREATED',
      entityType: 'MAINTENANCE',
      entityId: record.id,
      newValue: JSON.stringify({ asset: asset.name, description }),
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, message: 'Maintenance record created.', record });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/maintenance/:id
 */
const updateMaintenanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      maintenanceStatus, // 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'
      cost,
      description,
      restoredCondition = 'GOOD' // 'EXCELLENT', 'GOOD'
    } = req.body;

    const record = await prisma.maintenance.findUnique({
      where: { id },
      include: { asset: true, damageReport: true }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    }

    const dataToUpdate = {};
    if (maintenanceStatus) dataToUpdate.maintenanceStatus = maintenanceStatus;
    if (cost !== undefined) dataToUpdate.cost = parseFloat(cost) || 0.0;
    if (description) dataToUpdate.description = description.trim();

    if (maintenanceStatus === 'IN_PROGRESS' && !record.startedAt) {
      dataToUpdate.startedAt = new Date();
    }

    if (maintenanceStatus === 'COMPLETED') {
      dataToUpdate.completedAt = new Date();
    }

    const updatedRecord = await prisma.maintenance.update({
      where: { id },
      data: dataToUpdate,
      include: { asset: true }
    });

    // If maintenance completed, restore asset to AVAILABLE!
    if (maintenanceStatus === 'COMPLETED') {
      validateAssetTransition('MAINTENANCE', 'AVAILABLE');

      await prisma.asset.update({
        where: { id: record.assetId },
        data: {
          status: 'AVAILABLE',
          currentCondition: restoredCondition
        }
      });

      // If tied to damage report, resolve it
      if (record.damageReportId) {
        await prisma.damageReport.update({
          where: { id: record.damageReportId },
          data: { status: 'RESOLVED' }
        });
      }

      // Notify Admins & Staff
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'STAFF'] } },
        select: { id: true }
      });

      for (const u of staffUsers) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            title: '✨ Maintenance Completed & Asset Restocked',
            message: `Maintenance completed for "${record.asset.name}" (${record.asset.assetCode}). Restored to AVAILABLE condition (${restoredCondition}).`
          }
        });
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'MAINTENANCE_UPDATED',
      entityType: 'MAINTENANCE',
      entityId: id,
      oldValue: record.maintenanceStatus,
      newValue: maintenanceStatus || record.maintenanceStatus,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: maintenanceStatus === 'COMPLETED'
        ? 'Maintenance completed. Asset has been restored to AVAILABLE inventory.'
        : 'Maintenance record updated.',
      record: updatedRecord
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMaintenance,
  createMaintenanceRecord,
  updateMaintenanceStatus
};
