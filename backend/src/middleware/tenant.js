import { forbidden, notFound } from '../utils/responses.js';
import { query } from '../db.js';
import { isSuper } from './rbac.js';

export async function ensureTenantAccess(req, res, next) {
  try {
    const { tenantId } = req.params;
    const { rows } = await query('SELECT id FROM tenants WHERE id = $1', [tenantId]);
    if (!rows[0]) return notFound(res, 'Tenant not found');
    if (isSuper(req)) return next();
    if (req.user.tenantId !== tenantId) return forbidden(res, 'Unauthorized tenant access');
    return next();
  } catch (e) {
    return next(e);
  }
}
