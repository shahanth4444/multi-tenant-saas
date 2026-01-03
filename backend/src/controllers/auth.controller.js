/**
 * Authentication Controller
 * 
 * Handles user authentication, tenant registration, and session management.
 * Implements JWT-based authentication with role-based access control.
 * 
 * @module controllers/auth
 */

import { withTransaction, query } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { created, ok, badRequest, conflict, unauthorized, notFound, forbidden } from '../utils/responses.js';
import { auditLog } from '../utils/audit.js';

/**
 * Get Subscription Plan Limits
 * 
 * Returns user and project limits based on subscription plan tier.
 * 
 * @private
 * @param {string} plan - Subscription plan name (free, pro, enterprise)
 * @returns {Object} Object containing max users and projects allowed
 */
function planLimits(plan) {
  return plan === 'enterprise' ? { users: 100, projects: 50 } : plan === 'pro' ? { users: 25, projects: 15 } : { users: 5, projects: 3 };
}

/**
 * Register New Tenant
 * 
 * Creates a new tenant organization with an admin user.
 * Validates subdomain uniqueness and sets up initial subscription plan.
 * 
 * @async
 * @route POST /api/auth/register
 * @param {Object} req.body - Registration data
 * @param {string} req.body.tenantName - Organization name
 * @param {string} req.body.subdomain - Unique subdomain identifier
 * @param {string} req.body.adminEmail - Admin user email
 * @param {string} req.body.adminPassword - Admin user password
 * @param {string} req.body.adminFullName - Admin user full name
 * @returns {Object} 201 - Created tenant and admin user details
 * @returns {Object} 409 - Subdomain already exists
 */
export async function registerTenant(req, res, next) {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
  try {
    // Check subdomain availability
    const subCheck = await query('SELECT 1 FROM tenants WHERE subdomain = $1', [subdomain]);
    if (subCheck.rows[0]) return conflict(res, 'Subdomain already exists');

    // Default to free plan for new tenants
    const plan = 'free';
    const limits = planLimits(plan);

    // Create tenant and admin user in a transaction
    const result = await withTransaction(async (client) => {
      const t = await client.query(
        `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
         VALUES ($1,$2,'active',$3,$4,$5) RETURNING id, subdomain`,
        [tenantName, subdomain, plan, limits.users, limits.projects]
      );
      const tenantId = t.rows[0].id;

      // Hash password and create admin user
      const hash = await bcrypt.hash(adminPassword, 10);
      const u = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
         VALUES ($1,$2,$3,$4,'tenant_admin') RETURNING id, email, full_name, role`,
        [tenantId, adminEmail, hash, adminFullName]
      );
      return { tenantId, subdomain: t.rows[0].subdomain, adminUser: u.rows[0] };
    });

    // Log tenant registration for audit trail
    await auditLog({ tenantId: result.tenantId, action: 'REGISTER_TENANT', entityType: 'tenant', entityId: result.tenantId });

    return created(res, {
      tenantId: result.tenantId,
      subdomain: result.subdomain,
      adminUser: result.adminUser,
    }, 'Tenant registered successfully');
  } catch (e) { return next(e); }
}

/**
 * User Login
 * 
 * Authenticates a user and returns a JWT token.
 * Supports both tenant users and super admin login.
 * 
 * @async
 * @route POST /api/auth/login
 * @param {Object} req.body - Login credentials
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @param {string} [req.body.tenantSubdomain] - Tenant subdomain (for tenant users)
 * @param {number} [req.body.tenantId] - Tenant ID (alternative to subdomain)
 * @returns {Object} 200 - User details and JWT token
 * @returns {Object} 401 - Invalid credentials
 * @returns {Object} 403 - Account inactive or tenant not active
 * @returns {Object} 404 - Tenant not found
 */
export async function login(req, res, next) {
  const { email, password, tenantSubdomain, tenantId } = req.body;
  try {
    let tId = tenantId || null;

    // Resolve tenant ID from subdomain if provided
    if (!tId && tenantSubdomain) {
      const t = await query('SELECT id, status FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
      if (!t.rows[0]) return notFound(res, 'Tenant not found');
      if (t.rows[0].status !== 'active') return forbidden(res, 'Tenant not active');
      tId = t.rows[0].id;
    }

    // Find user - allow super_admin with null tenantId
    const { rows } = await query(
      `SELECT id, tenant_id, email, password_hash, full_name, role, is_active FROM users
       WHERE email = $1 AND (tenant_id = $2 OR ($2 IS NULL AND role='super_admin'))`,
      [email, tId]
    );
    const user = rows[0];

    // Validate user existence and status
    if (!user) return unauthorized(res, 'Invalid credentials');
    if (!user.is_active) return forbidden(res, 'Account inactive');

    // Verify password
    const okPass = await bcrypt.compare(password, user.password_hash);
    if (!okPass) return unauthorized(res, 'Invalid credentials');

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, tenantId: user.tenant_id, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    // Log successful login
    await auditLog({ tenantId: user.tenant_id, userId: user.id, action: 'LOGIN', entityType: 'user', entityId: user.id });

    return ok(res, {
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role, tenantId: user.tenant_id },
      token,
      expiresIn: 24 * 60 * 60,
    });
  } catch (e) { return next(e); }
}

/**
 * Get Current User Profile
 * 
 * Returns the authenticated user's profile and tenant information.
 * 
 * @async
 * @route GET /api/auth/me
 * @param {Object} req.user - Authenticated user from JWT middleware
 * @returns {Object} 200 - User profile and tenant details
 */
export async function me(req, res, next) {
  try {
    const u = req.user;
    let tenant = null;

    // Fetch tenant details if user belongs to a tenant
    if (u.tenantId) {
      const { rows } = await query('SELECT id, name, subdomain, subscription_plan, max_users, max_projects FROM tenants WHERE id=$1', [u.tenantId]);
      if (rows[0]) {
        tenant = {
          id: rows[0].id,
          name: rows[0].name,
          subdomain: rows[0].subdomain,
          subscriptionPlan: rows[0].subscription_plan,
          maxUsers: rows[0].max_users,
          maxProjects: rows[0].max_projects,
        };
      }
    }

    return ok(res, { id: u.id, email: u.email, fullName: u.fullName, role: u.role, isActive: u.isActive, tenant });
  } catch (e) { return next(e); }
}

/**
 * User Logout
 * 
 * Logs out the current user and records the action in audit log.
 * Note: JWT tokens remain valid until expiration (stateless auth).
 * 
 * @async
 * @route POST /api/auth/logout
 * @param {Object} req.user - Authenticated user from JWT middleware
 * @returns {Object} 200 - Logout confirmation
 */
export async function logout(req, res, next) {
  try {
    // Log logout action for audit trail
    await auditLog({ tenantId: req.user.tenantId, userId: req.user.id, action: 'LOGOUT', entityType: 'user', entityId: req.user.id });
    return ok(res, null, 'Logged out successfully');
  } catch (e) { return next(e); }
}
