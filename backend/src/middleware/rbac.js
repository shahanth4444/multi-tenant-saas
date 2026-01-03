/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides middleware functions to restrict access based on user roles.
 * Supports single role and multiple role authorization.
 * 
 * @module middleware/rbac
 */

import { forbidden } from '../utils/responses.js';

/**
 * Require Specific Role
 * 
 * Middleware factory that creates a middleware to require a specific role.
 * 
 * @param {string} role - Required role (e.g., 'super_admin', 'tenant_admin', 'user')
 * @returns {Function} Express middleware function
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return forbidden(res);
    if (req.user.role !== role) return forbidden(res, 'Insufficient role');
    next();
  };
}

/**
 * Require Any of Multiple Roles
 * 
 * Middleware factory that creates a middleware to require any of the specified roles.
 * 
 * @param {Array<string>} roles - Array of acceptable roles
 * @returns {Function} Express middleware function
 */
export function requireAnyRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return forbidden(res);
    if (!roles.includes(req.user.role)) return forbidden(res, 'Insufficient role');
    next();
  };
}

/**
 * Check if User is Super Admin
 * 
 * Helper function to check if the current user has super admin privileges.
 * 
 * @param {Object} req - Express request object with user attached
 * @returns {boolean} True if user is super admin, false otherwise
 */
export function isSuper(req) {
  return req.user?.role === 'super_admin';
}
