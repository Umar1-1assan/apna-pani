const jwt = require('jsonwebtoken');
const { unauthorized, forbidden, serverError } = require('../utils/apiResponse');
const User = require('../models/User');
const Supplier = require('../models/Supplier');
const DeliveryBoy = require('../models/DeliveryBoy');

/**
 * MIDDLEWARE 1: Authenticate JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const { JWT_SECRET } = process.env;
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token has been blacklisted (logged out)
    const TokenBlacklist = require('../models/TokenBlacklist');
    const isBlacklisted = await TokenBlacklist.findOne({ token });
    if (isBlacklisted) {
      return unauthorized(res, 'Token has been revoked');
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return unauthorized(res, 'User not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Invalid token');
    }
    return serverError(res, 'Authentication failed', error);
  }
};

/**
 * MIDDLEWARE 2: Inject tenant scope (supplierId)
 */
const injectTenantScope = async (req, res, next) => {
  try {
    if (req.user.role === 'super_admin') {
      req.supplierId = null;
      req.tenantScoped = false;
      return next();
    }

    if (req.user.role === 'supplier') {
      const supplier = await Supplier.findOne({ userId: req.user._id });
      if (!supplier) {
        return forbidden(res, 'Supplier profile not found');
      }
      req.supplierId = supplier._id;
      req.tenantScoped = true;
      return next();
    }

    if (req.user.role === 'delivery_boy') {
      const deliveryBoy = await DeliveryBoy.findOne({ userId: req.user._id });
      if (!deliveryBoy) {
        return forbidden(res, 'Delivery boy profile not found');
      }
      req.supplierId = deliveryBoy.supplierId;
      req.deliveryBoyId = deliveryBoy._id;
      req.riderId = deliveryBoy._id; // alias for controllers that use req.riderId
      req.tenantScoped = true;
      return next();
    }

    if (req.user.role === 'customer') {
      req.tenantScoped = true;
      return next();
    }

    next();
  } catch (error) {
    return serverError(res, 'Failed to inject tenant scope', error);
  }
};

/**
 * MIDDLEWARE 3: Require specific roles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return forbidden(
        res, 
        `Access denied. Required role: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

/**
 * MIDDLEWARE 4: Scope queries by tenant
 */
const scopeByTenant = (req, res, next) => {
  req.filterByTenant = (filter = {}) => {
    if (!req.supplierId) {
      return filter;
    }
    return {
      ...filter,
      supplierId: req.supplierId
    };
  };

  next();
};

/**
 * MIDDLEWARE 5: Async error handler wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  authenticate,
  injectTenantScope,
  requireRole,
  scopeByTenant,
  asyncHandler
};
