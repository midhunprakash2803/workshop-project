const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Production health check route
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'rentiq-backend-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
