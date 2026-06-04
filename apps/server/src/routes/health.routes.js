const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ok } = require('../utils/apiResponse');

/**
 * Public Health Routes
 */

// GET /api/health
router.get('/', (req, res) => {
  return ok(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, 'Server is healthy');
});

// GET /api/health/db
router.get('/db', (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return ok(res, {
      database: states[dbState],
      timestamp: new Date().toISOString()
    }, 'Database health check');
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
