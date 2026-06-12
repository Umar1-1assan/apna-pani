const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset attempts from this IP, please try again after 15 minutes'
  }
});

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
router.post('/forgot-password', resetLimiter, forgotPasswordHandler);

// POST /api/auth/reset-password
router.post('/reset-password', resetLimiter, resetPasswordHandler);

// POST /api/auth/send-otp
router.post('/send-otp', sendOtpHandler);

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyOtpHandler);

// POST /api/auth/refresh
router.post('/refresh', refreshTokenHandler);

// POST /api/auth/admin/login
router.post('/admin/login', adminLoginHandler);

// POST /api/auth/logout
router.post('/logout', authenticate, logoutHandler);

module.exports = router;
