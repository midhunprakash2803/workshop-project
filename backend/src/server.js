const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const fs = require('fs');

const env = require('./config/env');
const prisma = require('./config/db');
const { initCronJobs } = require('./services/cronService');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const assetRoutes = require('./routes/assetRoutes');
const requestRoutes = require('./routes/requestRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const damageRoutes = require('./routes/damageRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Ensure upload directory exists
const uploadPath = path.join(__dirname, '..', env.uploadDir);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Global Middlewares
app.use(cors({
  origin: '*', // Allows local dev and production client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded photo evidence statically
app.use('/uploads', express.static(uploadPath));

// Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/damage', damageRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback 404 for unknown endpoints
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

// Start Server & Background Cron Tasks
const server = app.listen(env.port, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 RentIQ Backend API Server running on port ${env.port}`);
  console.log(`📡 Environment: ${env.nodeEnv}`);
  console.log(`🏥 Health check: http://localhost:${env.port}/api/health`);
  console.log(`📁 Evidence uploads: http://localhost:${env.port}/uploads`);
  console.log(`======================================================\n`);

  // Initialize overdue detection background engine
  initCronJobs();
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down RentIQ server...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('🔌 Database connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error disconnecting from database:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;
