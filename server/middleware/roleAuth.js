/**
 * Role-Based Authentication Middleware for Dynable RBAC System
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Middleware functions for:
 * - Role-based route protection
 * - Permission checking
 * - Anonymous user handling
 * - Admin-only operations
 * - Seller-specific operations
 */

const { 
  verifyToken, 
  extractUserFromToken, 
  hasRole, 
  isAdmin, 
  isSeller, 
  isVerifiedSeller, 
  isAnonymous,
  canPerformAction 
} = require('../utils/jwt');

/**
 * Extract user from JWT token and attach to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please log in to access this resource'
      });
    }

    const user = extractUserFromToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid or expired token',
      message: 'Please log in again'
    });
  }
};

/**
 * Check if user has required role(s)
 * @param {string|Array} allowedRoles - Required role(s)
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
      }

      if (!hasRole(req.user, allowedRoles)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `This action requires ${Array.isArray(allowedRoles) ? allowedRoles.join(' or ') : allowedRoles} role`,
          required: allowedRoles,
          current: req.user.role 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Authorization error',
        message: 'An error occurred while checking permissions'
      });
    }
  };
};

/**
 * Check if user can perform specific action
 * @param {string} action - Action to check permission for
 * @returns {Function} Express middleware function
 */
const requirePermission = (action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
      }

      if (!canPerformAction(req.user, action)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `You don't have permission to ${action}`,
          required_action: action,
          current_role: req.user.role 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Authorization error',
        message: 'An error occurred while checking permissions'
      });
    }
  };
};

/**
 * Specific role middlewares
 */
const requireAdmin = requireRole(['admin']);
const requireSeller = requireRole(['seller', 'admin']);
const requireAuthenticated = requireRole(['end_user', 'seller', 'admin']);

/**
 * Allow anonymous users (no auth required)
 */
const allowAnonymous = (req, res, next) => {
  // Set default anonymous user if no token provided
  if (!req.user) {
    req.user = {
      id: null,
      email: null,
      name: null,
      role: 'anonymous',
      is_verified_seller: false,
      is_anonymous: true,
      converted_from_anonymous: false,
    };
  }
  next();
};

/**
 * Check if user is verified seller
 */
const requireVerifiedSeller = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    if (!isVerifiedSeller(req.user)) {
      return res.status(403).json({ 
        error: 'Seller verification required',
        message: 'You must be a verified seller to perform this action',
        current_role: req.user.role,
        is_verified_seller: req.user.is_verified_seller
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authorization error',
      message: 'An error occurred while checking seller status'
    });
  }
};

/**
 * Check if user is not anonymous
 */
const requireAuthenticatedUser = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    if (isAnonymous(req.user)) {
      return res.status(403).json({ 
        error: 'Account required',
        message: 'This action requires a permanent account. Please sign up or log in.',
        current_role: req.user.role
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authorization error',
      message: 'An error occurred while checking user status'
    });
  }
};

/**
 * Optional authentication - attach user if token provided
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = extractUserFromToken(token);
      req.user = user;
    } else {
      // Set anonymous user
      req.user = {
        id: null,
        email: null,
        name: null,
        role: 'anonymous',
        is_verified_seller: false,
        is_anonymous: true,
        converted_from_anonymous: false,
      };
    }

    next();
  } catch (error) {
    // If token is invalid, treat as anonymous
    req.user = {
      id: null,
      email: null,
      name: null,
      role: 'anonymous',
      is_verified_seller: false,
      is_anonymous: true,
      converted_from_anonymous: false,
    };
    next();
  }
};

/**
 * Resource ownership middleware
 * @param {Function} getResourceOwnerId - Function to get resource owner ID
 * @returns {Function} Express middleware function
 */
const requireOwnership = (getResourceOwnerId) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Please log in to access this resource'
        });
      }

      // Admins can access everything
      if (isAdmin(req.user)) {
        return next();
      }

      const resourceOwnerId = getResourceOwnerId(req);
      
      if (!resourceOwnerId) {
        return res.status(404).json({ 
          error: 'Resource not found',
          message: 'The requested resource does not exist'
        });
      }

      if (req.user.id.toString() !== resourceOwnerId.toString()) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only access your own resources'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Authorization error',
        message: 'An error occurred while checking resource ownership'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  requireAdmin,
  requireSeller,
  requireAuthenticated,
  requireVerifiedSeller,
  requireAuthenticatedUser,
  allowAnonymous,
  optionalAuth,
  requireOwnership,
}; 