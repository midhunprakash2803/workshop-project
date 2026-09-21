const cron = require('node-cron');
const prisma = require('../config/db');
const { logAudit } = require('./auditService');

/**
 * Scan for overdue rentals and update statuses, generate notifications, and write audit logs.
 */
const runOverdueCheck = async () => {
  try {
    const now = new Date();

    // Find active rentals past their due date
    const overdueRentals = await prisma.rental.findMany({
      where: {
        status: 'ACTIVE',
        dueDate: { lt: now }
      },
      include: {
        asset: true,
        borrower: true
      }
    });

    if (overdueRentals.length === 0) {
      return { updatedCount: 0, items: [] };
    }

    console.log(`⏰ [Cron Engine] Found ${overdueRentals.length} overdue rental(s). Processing...`);

    const updated = [];

    for (const rental of overdueRentals) {
      // 1. Update Rental Status
      const updatedRental = await prisma.rental.update({
        where: { id: rental.id },
        data: { status: 'OVERDUE' }
      });

      // 2. Update Asset Status if needed
      await prisma.asset.update({
        where: { id: rental.assetId },
        data: { status: 'OVERDUE' }
      });

      // 3. Create Notification for Borrower
      await prisma.notification.create({
        data: {
          userId: rental.borrowerId,
          title: '🚨 Rental Past Due Date!',
          message: `Your rental for "${rental.asset.name}" (${rental.asset.assetCode}) was due on ${rental.dueDate.toLocaleDateString()}. Please initiate return immediately.`
        }
      });

      // 4. Create Notification for Staff / Admins
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'STAFF'] } },
        select: { id: true }
      });

      for (const staff of staffUsers) {
        await prisma.notification.create({
          data: {
            userId: staff.id,
            title: '⚠️ Overdue Asset Alert',
            message: `Asset "${rental.asset.name}" (${rental.asset.assetCode}) borrowed by ${rental.borrower.name} is now OVERDUE.`
          }
        });
      }

      // 5. Write to Audit Log
      await logAudit({
        userId: null,
        action: 'RENTAL_MARKED_OVERDUE',
        entityType: 'RENTAL',
        entityId: rental.id,
        oldValue: 'ACTIVE',
        newValue: 'OVERDUE',
        ipAddress: '127.0.0.1 (cron)'
      });

      updated.push({
        rentalId: rental.id,
        assetCode: rental.asset.assetCode,
        assetName: rental.asset.name,
        borrower: rental.borrower.name,
        dueDate: rental.dueDate
      });
    }

    console.log(`✅ [Cron Engine] Successfully processed ${updated.length} overdue rental(s).`);
    return { updatedCount: updated.length, items: updated };
  } catch (error) {
    console.error('❌ [Cron Engine Error]:', error.message);
    return { error: error.message };
  }
};

/**
 * Initialize background scheduled cron job
 */
const initCronJobs = () => {
  // Run every 2 minutes in development, or every hour: '0 * * * *'
  // Using '*/2 * * * *' for responsive testing and live overdue detection
  cron.schedule('*/2 * * * *', async () => {
    console.log('⏳ Running scheduled overdue check job...');
    await runOverdueCheck();
  });

  console.log('⏰ Overdue Detection Cron Engine initialized (scheduled every 2 minutes).');
};

module.exports = {
  initCronJobs,
  runOverdueCheck
};
