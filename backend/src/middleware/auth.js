import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { unauthorized } from '../utils/responses.js';

export async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return unauthorized(res, 'Token missing');

    const payload = jwt.verify(token, config.jwt.secret);
    // attach user from DB (fresh isActive/role/tenant)
    const { rows } = await query('SELECT id, tenant_id, email, full_name, role, is_active FROM users WHERE id = $1', [payload.userId]);
    if (!rows[0]) return unauthorized(res, 'User not found');
    if (!rows[0].is_active) return unauthorized(res, 'Account inactive');
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
