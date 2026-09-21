const prisma = require('../config/db');
const { validateAssetTransition } = require('../services/stateMachineService');
const { logAudit } = require('../services/auditService');

/**
 * GET /api/assets
 * Filters: search, categoryId, status, condition
 */
const getAllAssets = async (req, res, next) => {
  try {
    const { search, categoryId, status, condition } = req.query;

    const where = {};

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (condition && condition !== 'ALL') {
      where.currentCondition = condition;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { assetCode: { contains: q } },
        { description: { contains: q } }
      ];
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
        rentals: {
          where: {
            status: { in: ['ACTIVE', 'OVERDUE', 'RETURN_INITIATED', 'INSPECTION'] }
          },
          include: {
            borrower: {
              select: { id: true, name: true, email: true }
            }
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: assets.length,
      assets: assets.map(asset => ({
        ...asset,
        activeRental: asset.rentals[0] || null
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assets/:id
 */
const getAssetById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        rentals: {
          include: {
            borrower: { select: { id: true, name: true, email: true } },
            issuer: { select: { id: true, name: true } },
            conditions: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        damageReports: {
          orderBy: { createdAt: 'desc' }
        },
        maintenance: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const activeRental = asset.rentals.find(r => ['ACTIVE', 'OVERDUE', 'RETURN_INITIATED', 'INSPECTION'].includes(r.status)) || null;

    res.json({
      success: true,
      asset: {
        ...asset,
        activeRental
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assets/code/:code
 * Used for QR code scanning lookup
 */
const getAssetByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { assetCode: code },
          { qrToken: code },
          { id: code }
        ]
      },
      include: {
        category: true,
        rentals: {
          where: {
            status: { in: ['ACTIVE', 'OVERDUE', 'RETURN_INITIATED', 'INSPECTION'] }
          },
          include: {
            borrower: { select: { id: true, name: true, email: true } }
          },
          take: 1
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: `No asset found matching identifier: ${code}` });
    }

    res.json({
      success: true,
      asset: {
        ...asset,
        activeRental: asset.rentals[0] || null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/assets
 * Admin only
 */
const createAsset = async (req, res, next) => {
  try {
    const {
      name,
      categoryId,
      description,
      specifications,
      currentCondition = 'EXCELLENT',
      imageUrl,
      assetCode: customCode
    } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ success: false, message: 'Asset name and category are required.' });
    }

    // Generate unique asset code if not supplied
    const assetCode = customCode || `AST-${Date.now().toString().slice(-6)}`;
    const qrToken = `QR-${assetCode}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newAsset = await prisma.asset.create({
      data: {
        name: name.trim(),
        assetCode: assetCode.trim().toUpperCase(),
        categoryId,
        description: description ? description.trim() : null,
        specifications: typeof specifications === 'object' ? JSON.stringify(specifications) : specifications,
        qrToken,
        status: 'AVAILABLE',
        currentCondition,
        imageUrl: imageUrl || null
      },
      include: {
        category: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'ASSET_CREATED',
      entityType: 'ASSET',
      entityId: newAsset.id,
      newValue: JSON.stringify({ name: newAsset.name, code: newAsset.assetCode }),
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Asset created successfully.',
      asset: newAsset
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/assets/:id
 * Admin / Staff
 */
const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      categoryId,
      description,
      specifications,
      status,
      currentCondition,
      imageUrl
    } = req.body;

    const existing = await prisma.asset.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    // If status is changing, enforce state machine validation
    if (status && status !== existing.status) {
      validateAssetTransition(existing.status, status);
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(categoryId && { categoryId }),
        ...(description !== undefined && { description }),
        ...(specifications !== undefined && {
          specifications: typeof specifications === 'object' ? JSON.stringify(specifications) : specifications
        }),
        ...(status && { status }),
        ...(currentCondition && { currentCondition }),
        ...(imageUrl !== undefined && { imageUrl })
      },
      include: {
        category: true
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'ASSET_UPDATED',
      entityType: 'ASSET',
      entityId: updated.id,
      oldValue: JSON.stringify({ status: existing.status, condition: existing.currentCondition }),
      newValue: JSON.stringify({ status: updated.status, condition: updated.currentCondition }),
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Asset updated successfully.',
      asset: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/assets/:id
 * Admin only
 */
const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params;

    const activeRentals = await prisma.rental.count({
      where: {
        assetId: id,
        status: { in: ['ACTIVE', 'OVERDUE', 'RETURN_INITIATED', 'INSPECTION'] }
      }
    });

    if (activeRentals > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an asset that is currently rented out or undergoing inspection.'
      });
    }

    await prisma.asset.delete({
      where: { id }
    });

    await logAudit({
      userId: req.user.id,
      action: 'ASSET_DELETED',
      entityType: 'ASSET',
      entityId: id,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAssets,
  getAssetById,
  getAssetByCode,
  createAsset,
  updateAsset,
  deleteAsset
};
