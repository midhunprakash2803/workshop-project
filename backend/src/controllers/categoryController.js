const prisma = require('../config/db');
const { logAudit } = require('../services/auditService');

/**
 * GET /api/categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res, next) => {
  try {
    const category = await prisma.assetCategory.findUnique({
      where: { id: req.params.id },
      include: {
        assets: true
      }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, category });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = await prisma.assetCategory.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists.' });
    }

    const category = await prisma.assetCategory.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CATEGORY_CREATED',
      entityType: 'CATEGORY',
      entityId: category.id,
      newValue: category.name,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, message: 'Category created.', category });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existing = await prisma.assetCategory.findUnique({
      where: { id: req.params.id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const updated = await prisma.assetCategory.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null })
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CATEGORY_UPDATED',
      entityType: 'CATEGORY',
      entityId: updated.id,
      oldValue: existing.name,
      newValue: updated.name,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Category updated.', category: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const assetCount = await prisma.asset.count({
      where: { categoryId: req.params.id }
    });

    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category containing ${assetCount} asset(s). Reassign them first.`
      });
    }

    await prisma.assetCategory.delete({
      where: { id: req.params.id }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CATEGORY_DELETED',
      entityType: 'CATEGORY',
      entityId: req.params.id,
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
