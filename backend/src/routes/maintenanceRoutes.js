const express = require('express');
const router = express.Router();
const {
  getAllMaintenance,
  createMaintenanceRecord,
  updateMaintenanceStatus
} = require('../controllers/maintenanceController');
const { authenticateJWT, requireRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateJWT, requireRoles('ADMIN', 'STAFF'), getAllMaintenance);
router.post('/', authenticateJWT, requireRoles('ADMIN', 'STAFF'), createMaintenanceRecord);
router.put('/:id', authenticateJWT, requireRoles('ADMIN', 'STAFF'), updateMaintenanceStatus);

module.exports = router;
