const express = require('express');
const router = express.Router();
const {
  listSuppliersHandler,
  getProfileHandler,
  updateProfileHandler
} = require('../controllers/users');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * Public User Routes
 */

// GET /api/users/suppliers - Public: list active suppliers
router.get('/suppliers', listSuppliersHandler);

/**
 * Protected User Routes
 */
router.get('/profile', authenticate, getProfileHandler);
router.put('/profile', authenticate, updateProfileHandler);

module.exports = router;
