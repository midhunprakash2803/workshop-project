const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const env = require('../config/env');
const { logAudit } = require('../services/auditService');

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account has been suspended.' });
    }

    const token = generateToken(user);

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      newValue: `Logged in with role ${user.role}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'BORROWER',
        status: 'ACTIVE'
      }
    });

    const token = generateToken(newUser);

    await logAudit({
      userId: newUser.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: newUser.id,
      newValue: `Registered as ${newUser.role}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

/**
 * GET /api/auth/demo-accounts
 * For easy 1-click test logins on the frontend
 */
const getDemoAccounts = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: ['admin@rentiq.com', 'staff1@rentiq.com', 'staff2@rentiq.com', 'borrower1@rentiq.com', 'borrower2@rentiq.com']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    const defaultPasswords = {
      'admin@rentiq.com': 'Admin@123',
      'staff1@rentiq.com': 'Staff@123',
      'staff2@rentiq.com': 'Staff@123',
      'borrower1@rentiq.com': 'Borrower@123',
      'borrower2@rentiq.com': 'Borrower@123'
    };

    const accountsWithCredentials = users.map(u => ({
      ...u,
      defaultPassword: defaultPasswords[u.email] || 'Pass@123'
    }));

    res.json({
      success: true,
      accounts: accountsWithCredentials
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getMe,
  getDemoAccounts
};
