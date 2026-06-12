/**
 * Password complexity validator.
 * Enforces minimum security standards for user passwords.
 * 
 * @param {string} password - The password to validate
 * @returns {{ valid: boolean, message?: string }}
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}

module.exports = { validatePassword };
