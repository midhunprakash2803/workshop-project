const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  approveRequest,
  rejectRequest,
  cancelRequest
} = require('../controllers/requestController');
const { authenticateJWT, requireRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateJWT, createRequest);
router.get('/', authenticateJWT, getRequests);
router.put('/:id/approve', authenticateJWT, requireRoles('ADMIN'), approveRequest);
router.put('/:id/reject', authenticateJWT, requireRoles('ADMIN'), rejectRequest);
router.put('/:id/cancel', authenticateJWT, cancelRequest);

module.exports = router;
