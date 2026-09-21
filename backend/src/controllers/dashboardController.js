const prisma = require('../config/db');

/**
 * GET /api/dashboard/metrics
 * Live dashboard KPIs and statistics
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const [
      totalAssets,
      availableAssets,
      activeRentals,
      overdueRentals,
      damagedAssets,
      maintenanceCount,
      pendingRequests,
      categoriesCount,
      recentRentals,
      recentAuditLogs,
      categoriesWithCount,
      statusGroups
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.rental.count({ where: { status: 'ACTIVE' } }),
      prisma.rental.count({ where: { status: 'OVERDUE' } }),
      prisma.asset.count({ where: { currentCondition: 'DAMAGED' } }),
      prisma.maintenance.count({ where: { maintenanceStatus: { in: ['SCHEDULED', 'IN_PROGRESS'] } } }),
      prisma.rentalRequest.count({ where: { status: 'PENDING' } }),
      prisma.assetCategory.count(),

      // Recent rentals
      prisma.rental.findMany({
        include: {
          asset: true,
          borrower: { select: { id: true, name: true, email: true } },
          issuer: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),

      // Recent audit activities
      prisma.auditLog.findMany({
        include: {
          user: { select: { id: true, name: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),

      // Category counts
      prisma.assetCategory.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { assets: true }
          }
        }
      }),

      // Asset count by status
      prisma.asset.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
    ]);

    // Active overdue items
    const overdueList = await prisma.rental.findMany({
      where: { status: 'OVERDUE' },
      include: {
        asset: true,
        borrower: { select: { id: true, name: true, email: true } }
      },
      take: 5
    });

    res.json({
      success: true,
      metrics: {
        totalAssets,
        availableAssets,
        activeRentals,
        overdueRentals,
        damagedAssets,
        maintenanceCount,
        pendingRequests,
        categoriesCount
      },
      recentRentals,
      recentAuditLogs,
      categoryDistribution: categoriesWithCount.map(c => ({
        name: c.name,
        count: c._count.assets
      })),
      statusDistribution: statusGroups.map(s => ({
        status: s.status,
        count: s._count.status
      })),
      overdueList
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics
};
