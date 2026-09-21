const express = require('express');
const router = express.Router();
const {
  uploadEvidencePhotos,
  submitReturnInspection,
  getInspectionComparison
} = require('../controllers/inspectionController');
const { authenticateJWT, requireRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post(
  '/upload',
  authenticateJWT,
  requireRoles('ADMIN', 'STAFF'),
  upload.array('photos', 6),
  uploadEvidencePhotos
);

router.post(
  '/inspect',
  authenticateJWT,
  requireRoles('ADMIN', 'STAFF'),
  submitReturnInspection
);

router.get(
  '/comparison/:rentalId',
  authenticateJWT,
  getInspectionComparison
);

module.exports = router;
