const express = require('express');
const router = express.Router();
const {
  getAllDamageReports,
  createDamageReport,
  updateDamageReport
} = require('../controllers/damageController');
const { authenticateJWT, requireRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateJWT, requireRoles('ADMIN', 'STAFF'), getAllDamageReports);
router.post('/', authenticateJWT, requireRoles('ADMIN', 'STAFF'), createDamageReport);
router.put('/:id', authenticateJWT, requireRoles('ADMIN'), updateDamageReport);

module.exports = router;
