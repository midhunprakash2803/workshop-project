const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/dashboardController');
const { authenticateJWT, requireRoles } = require('../middleware/authMiddleware');

router.get('/metrics', authenticateJWT, requireRoles('ADMIN', 'STAFF'), getDashboardMetrics);

module.exports = router;
