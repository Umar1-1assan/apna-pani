const express = require('express');
const router = express.Router();
const {
  listSuppliersHandler
} = require('../controllers/user.controller');

/**
 * Public User Routes
 */

// GET /api/users/suppliers - Public: list active suppliers
router.get('/suppliers', listSuppliersHandler);

module.exports = router;
