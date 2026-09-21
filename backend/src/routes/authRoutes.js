const express = require('express');
const router = express.Router();
const { login, register, getMe, getDemoAccounts } = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateJWT, getMe);
router.get('/demo-accounts', getDemoAccounts);

module.exports = router;
