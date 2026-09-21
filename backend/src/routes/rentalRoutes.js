const express = require('express');
const router = express.Router();
const {
  issueAsset,
  initiateReturn,
  getRentals,
  getRentalById,
  triggerOverdueCheck,
  sendReturnReminder
} = require('../controllers/rentalController');
const { authenticateJWT, requireRoles } = require('../middleware/authMiddleware');

router.post('/issue', authenticateJWT, requireRoles('ADMIN', 'STAFF'), issueAsset);
router.put('/:id/initiate-return', authenticateJWT, initiateReturn);
router.get('/', authenticateJWT, getRentals);
router.get('/:id', authenticateJWT, getRentalById);
router.post('/check-overdue', authenticateJWT, requireRoles('ADMIN', 'STAFF'), triggerOverdueCheck);
router.post('/:id/remind', authenticateJWT, requireRoles('ADMIN', 'STAFF'), sendReturnReminder);

module.exports = router;
