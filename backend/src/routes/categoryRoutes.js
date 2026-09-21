const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authenticateJWT, requireRoles } = require('../middleware/authMiddleware');

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', authenticateJWT, requireRoles('ADMIN'), createCategory);
router.put('/:id', authenticateJWT, requireRoles('ADMIN'), updateCategory);
router.delete('/:id', authenticateJWT, requireRoles('ADMIN'), deleteCategory);

module.exports = router;
