const express = require('express');
const router = express.Router();
const {
  getAllAssets,
  getAssetById,
  getAssetByCode,
  createAsset,
  updateAsset,
  deleteAsset
} = require('../controllers/assetController');
const { authenticateJWT, requireRoles } = require('../middleware/authMiddleware');

router.get('/', getAllAssets);
router.get('/code/:code', getAssetByCode);
router.get('/:id', getAssetById);
router.post('/', authenticateJWT, requireRoles('ADMIN'), createAsset);
router.put('/:id', authenticateJWT, requireRoles('ADMIN', 'STAFF'), updateAsset);
router.delete('/:id', authenticateJWT, requireRoles('ADMIN'), deleteAsset);

module.exports = router;
