/**
 * JWT Token Generation Utilities for Dynable RBAC System
 * Author: Justin Linzan
 * Date: June 2025
 * 
 * Enhanced JWT token generation with:
 * - Role-based access control claims
 * - Supabase RLS compatibility
 * - Anonymous user handling
 * - Custom claims for different auth scenarios
 */

const jwt = require('jsonwebtoken');

/**
 * Generate standard JWT token for API authentication
 * @param {Object} user - User object from database
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'end_user',
    is_verified_seller: user.is_verified_seller || false,
    converted_from_anonymous: user.converted_from_anonymous || false,
    // Standard JWT claims
    aud: 'authenticated',
    iss: 'dynable-api',
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};

/**
 * Generate Supabase-compatible JWT token for RLS policies
 * @param {Object} user - User object from database
 * @returns {string} Supabase JWT token
 */
const generateSupabaseToken = (user) => {
  const payload = {
    // Supabase expects these specific fields
    sub: user.id.toString(), // Supabase expects string
    email: user.email,
    role: user.role || 'end_user',
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    iat: Math.floor(Date.now() / 1000),
    // Custom claims for RLS policies
    is_verified_seller: user.is_verified_seller || false,
    converted_from_anonymous: user.converted_from_anonymous || false,
    is_anonymous: false, // Always false for authenticated users
  };

  return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);
};

/**
 * Generate anonymous user token for Supabase
 * @param {string} anonymousId - Anonymous user ID from Supabase
 * @returns {string} Anonymous JWT token
 */
const generateAnonymousToken = (anonymousId) => {
  const payload = {
    sub: anonymousId,
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    iat: Math.floor(Date.now() / 1000),
    // Anonymous-specific claims
    role: 'anonymous',
    is_anonymous: true,
    is_verified_seller: false,
    converted_from_anonymous: false,
  };

  return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET);
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - JWT secret (optional, defaults to JWT_SECRET)
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Extract user information from JWT token
 * @param {string} token - JWT token
 * @returns {Object} User information from token
 */
const extractUserFromToken = (token) => {
  const decoded = verifyToken(token);
  return {
    id: decoded.id || decoded.sub,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role || 'end_user',
    is_verified_seller: decoded.is_verified_seller || false,
    is_anonymous: decoded.is_anonymous || false,
    converted_from_anonymous: decoded.converted_from_anonymous || false,
  };
};

/**
 * Check if user has required role
 * @param {Object} user - User object or token payload
 * @param {string|Array} requiredRole - Required role(s)
 * @returns {boolean} Whether user has required role
 */
const hasRole = (user, requiredRole) => {
  const userRole = user.role || 'end_user';
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  return requiredRoles.includes(userRole);
};

/**
 * Check if user is admin
 * @param {Object} user - User object or token payload
 * @returns {boolean} Whether user is admin
 */
const isAdmin = (user) => {
  return hasRole(user, 'admin');
};

/**
 * Check if user is seller
 * @param {Object} user - User object or token payload
 * @returns {boolean} Whether user is seller
 */
const isSeller = (user) => {
  return hasRole(user, ['seller', 'admin']);
};

/**
 * Check if user is verified seller
 * @param {Object} user - User object or token payload
 * @returns {boolean} Whether user is verified seller
 */
const isVerifiedSeller = (user) => {
  return isSeller(user) && (user.is_verified_seller === true);
};

/**
 * Check if user is anonymous
 * @param {Object} user - User object or token payload
 * @returns {boolean} Whether user is anonymous
 */
const isAnonymous = (user) => {
  return user.is_anonymous === true || user.role === 'anonymous';
};

/**
 * Check if user can perform action
 * @param {Object} user - User object or token payload
 * @param {string} action - Action to perform
 * @returns {boolean} Whether user can perform action
 */
const canPerformAction = (user, action) => {
  const permissions = {
    'view_products': true, // Everyone can view products
    'add_to_cart': true, // Everyone can add to cart
    'checkout': !isAnonymous(user), // Only authenticated users can checkout
    'manage_own_products': isVerifiedSeller(user),
    'manage_all_products': isAdmin(user),
    'view_all_users': isAdmin(user),
    'manage_user_roles': isAdmin(user),
    'apply_seller': !isAnonymous(user) && !isSeller(user),
    'view_orders': !isAnonymous(user),
    'create_orders': !isAnonymous(user),
  };

  return permissions[action] || false;
};

module.exports = {
  generateToken,
  generateSupabaseToken,
  generateAnonymousToken,
  verifyToken,
  extractUserFromToken,
  hasRole,
  isAdmin,
  isSeller,
  isVerifiedSeller,
  isAnonymous,
  canPerformAction,
}; 