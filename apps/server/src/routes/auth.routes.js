const express = require('express');
const router = express.Router();
const {
  sendOtpHandler,
  verifyOtpHandler,
  refreshTokenHandler,
  adminLoginHandler,
  logoutHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler
} = require('../controllers/auth');

// Public Auth Routes

// POST /api/auth/login
router.post('/login', loginHandler);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordHandler);

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordHandler);

// POST /api/auth/send-otp
router.post('/send-otp', sendOtpHandler);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtpHandler);

// POST /api/auth/refresh
router.post('/refresh', refreshTokenHandler);

// POST /api/auth/admin/login
router.post('/admin/login', adminLoginHandler);

// POST /api/auth/logout
router.post('/logout', logoutHandler);

module.exports = router;
