// Pakistani phone number utilities
const PK_PHONE_REGEX = /^(\+92|0)(3[0-9]{2})[0-9]{7}$/;
const E164_REGEX = /^\+92[0-9]{10}$/;

/**
 * Normalize Pakistani phone number to E.164 format
 * @param {string} input - Phone number (03001234567 or +923001234567)
 * @returns {string} - Phone in E.164 format (+92XXXXXXXXXX)
 */
const normalizePhone = (input) => {
  if (!input) return null;

  let cleaned = input.toString().replace(/[\s\-]/g, '');

  if (E164_REGEX.test(cleaned)) {
    return cleaned;
  }

  if (cleaned.startsWith('92') && cleaned.length === 12) {
    return '+' + cleaned;
  }

  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return '+92' + cleaned.slice(1);
  }

  if (/^[0-9]{10}$/.test(cleaned)) {
    return '+92' + cleaned;
  }

  return null;
};

/**
 * Validate Pakistani phone number
 * @param {string} phone - Phone number in E.164 format
 * @returns {boolean} - Whether the phone is valid
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  return E164_REGEX.test(phone);
};

/**
 * Format phone for display (from E.164 to 0XXX-XXXXXXX)
 * @param {string} phone - Phone in E.164 format
 * @returns {string} - Formatted phone (03XX-XXXXXXX)
 */
const formatPhoneForDisplay = (phone) => {
  if (!isValidPhone(phone)) return phone;
  
  const local = '0' + phone.slice(3);
  return local.slice(0, 4) + '-' + local.slice(4);
};

/**
 * Get carrier from phone number
 * @param {string} phone - Phone in E.164 format
 * @returns {string} - Carrier name
 */
const getCarrier = (phone) => {
  if (!isValidPhone(phone)) return null;

  const prefix = phone.slice(3, 5);

  const carriers = {
    '30': 'Zong',
    '33': 'Zong',
    '31': 'Jazz',
    '32': 'Jazz',
    '34': 'Telenor',
    '35': 'Telenor',
    '37': 'Ufone',
    '36': 'Ufone',
    '39': 'Warid'
  };

  return carriers[prefix] || 'Unknown';
};

module.exports = {
  PK_PHONE_REGEX,
  E164_REGEX,
  normalizePhone,
  isValidPhone,
  formatPhoneForDisplay,
  getCarrier
};
