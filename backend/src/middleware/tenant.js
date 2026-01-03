/**
 * Tenant Access Control Middleware
 * 
 * Ensures proper tenant isolation by validating tenant access permissions.
 * Prevents users from accessing resources of other tenants.
 * 
 * @module middleware/tenant
 */

import { forbidden, notFound } from '../utils/responses.js';
import { query } from '../db.js';
import { isSuper } from './rbac.js';

/**
 * Ensure Tenant Access Authorization
 * 
 * Validates that the user has permission to access the specified tenant.
 * Super admins can access any tenant, regular users only their own.
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params.tenantId - Tenant ID from route parameters
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} 403 - If user lacks permission to access tenant
 * @returns {Object} 404 - If tenant does not exist
 */
export async function ensureTenantAccess(req, res, next) {
  try {
    const { tenantId } = req.params;

    // Verify tenant exists
    const { rows } = await query('SELECT id FROM tenants WHERE id = $1', [tenantId]);
    if (!rows[0]) return notFound(res, 'Tenant not found');

    // Super admins can access any tenant
    if (isSuper(req)) return next();

    // Regular users can only access their own tenant
    if (req.user.tenantId !== tenantId) return forbidden(res, 'Unauthorized tenant access');

    return next();
  } catch (e) {
    return next(e);
  }
}
