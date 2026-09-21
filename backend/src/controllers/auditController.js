const prisma = require('../config/db');

/**
 * GET /api/audit
 * Admin and Staff audit trail viewer
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, limit = 50, offset = 0, search } = req.query;
    const where = {};

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { action: { contains: q } },
        { entityType: { contains: q } },
        { oldValue: { contains: q } },
        { newValue: { contains: q } }
      ];
    }

    const total = await prisma.auditLog.count({ where });

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
      skip: parseInt(offset, 10)
    });

    res.json({
      success: true,
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs
};
