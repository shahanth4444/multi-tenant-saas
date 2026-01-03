/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and attaches authenticated user to request object.
 * Ensures user is active and exists in the database.
 * 
 * @module middleware/auth
 */

import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { unauthorized } from '../utils/responses.js';

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT token from Authorization header and loads user data.
 * Attaches user object to req.user for downstream middleware and routes.
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} 401 - If token is missing, invalid, or user is inactive
 */
export async function auth(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return unauthorized(res, 'Token missing');

    // Verify and decode JWT token
    const payload = jwt.verify(token, config.jwt.secret);

    // Fetch fresh user data from database to ensure current status
    const { rows } = await query('SELECT id, tenant_id, email, full_name, role, is_active FROM users WHERE id = $1', [payload.userId]);
    if (!rows[0]) return unauthorized(res, 'User not found');
    if (!rows[0].is_active) return unauthorized(res, 'Account inactive');

    // Attach user to request object
    req.user = {
      id: rows[0].id,
      tenantId: rows[0].tenant_id,
      email: rows[0].email,
      fullName: rows[0].full_name,
      role: rows[0].role,
      isActive: rows[0].is_active,
    };

    next();
  } catch (e) {
    return unauthorized(res, 'Invalid or expired token');
  }
}
