const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditController');
const { authenticateJWT, requireRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateJWT, requireRoles('ADMIN', 'STAFF'), getAuditLogs);

module.exports = router;
