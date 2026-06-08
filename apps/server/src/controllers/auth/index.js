const { generateTokens } = require('./generateTokens');
const { sendOtpHandler } = require('./sendOtpHandler');
const { verifyOtpHandler } = require('./verifyOtpHandler');
const { refreshTokenHandler } = require('./refreshTokenHandler');
const { adminLoginHandler } = require('./adminLoginHandler');
const { loginHandler } = require('./loginHandler');
const { forgotPasswordHandler } = require('./forgotPasswordHandler');
const { resetPasswordHandler } = require('./resetPasswordHandler');
const { logoutHandler } = require('./logoutHandler');

module.exports = {
  generateTokens,
  sendOtpHandler,
  verifyOtpHandler,
  refreshTokenHandler,
  adminLoginHandler,
  loginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  logoutHandler
};
