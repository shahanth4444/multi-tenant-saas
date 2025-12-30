import bcrypt from 'bcrypt';
import { query } from '../db.js';
import { created, ok, conflict, forbidden, notFound, badRequest } from '../utils/responses.js';
import { auditLog } from '../utils/audit.js';

function isSuper(req) { return req.user?.role === 'super_admin'; }
function isTenantAdmin(req) { return req.user?.role === 'tenant_admin'; }

export async function addUser(req, res, next) {
  const { tenantId } = req.params;
  const { email, password, fullName, role = 'user' } = req.body;
  try {
    // must be tenant_admin of same tenant
    if (!isTenantAdmin(req) || req.user.tenantId !== tenantId) return forbidden(res);

    // subscription limit
    const t = await query('SELECT max_users FROM tenants WHERE id=$1', [tenantId]);
    const max = t.rows[0]?.max_users || 0;
    const cnt = await query('SELECT COUNT(*)::int AS c FROM users WHERE tenant_id=$1', [tenantId]);
    if (cnt.rows[0].c >= max) return forbidden(res, 'Subscription limit reached');

    // unique per tenant
    const exists = await query('SELECT 1 FROM users WHERE tenant_id=$1 AND email=$2', [tenantId, email]);
    if (exists.rows[0]) return conflict(res, 'Email already exists in this tenant');

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, email, full_name, role, tenant_id, is_active, created_at`,
      [tenantId, email, hash, fullName, role]
    );

    await auditLog({ tenantId, userId: req.user.id, action: 'CREATE_USER', entityType: 'user', entityId: rows[0].id });
    return created(res, {
      id: rows[0].id,
      email: rows[0].email,
      fullName: rows[0].full_name,
      role: rows[0].role,
      tenantId: rows[0].tenant_id,
      isActive: rows[0].is_active,
      createdAt: rows[0].created_at,
    }, 'User created successfully');
  } catch (e) { return next(e); }
}

export async function listUsers(req, res, next) {
  const { tenantId } = req.params;
  const { search = '', role, page = '1', limit = '50' } = req.query;
  try {
    if (!isSuper(req) && req.user.tenantId !== tenantId) return forbidden(res);

    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const clauses = ['tenant_id = $1'];
    const params = [tenantId];
    if (role) { params.push(role); clauses.push(`role = $${params.length}`); }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      clauses.push(`(LOWER(full_name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`);
    }
    const where = clauses.join(' AND ');

    const list = await query(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM users WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, l, offset]
    );
    const count = await query(`SELECT COUNT(*)::int AS c FROM users WHERE ${where}`, params);

    return ok(res, {
      users: list.rows.map(r => ({ id: r.id, email: r.email, fullName: r.full_name, role: r.role, isActive: r.is_active, createdAt: r.created_at })),
      total: count.rows[0].c,
      pagination: { currentPage: p, totalPages: Math.ceil(count.rows[0].c / l), limit: l }
    });
  } catch (e) { return next(e); }
}

export async function updateUser(req, res, next) {
  const { userId } = req.params;
  const { fullName, role, isActive } = req.body;
  try {
    const { rows } = await query('SELECT id, tenant_id, role FROM users WHERE id=$1', [userId]);
    const target = rows[0];
    if (!target) return notFound(res, 'User not found');

    const sameTenant = req.user.tenantId && req.user.tenantId === target.tenant_id;

    if (req.user.id === userId) {
      // Self can update only fullName
      if (typeof fullName === 'undefined') return badRequest(res, 'Nothing to update');
      await query('UPDATE users SET full_name=$1, updated_at=NOW() WHERE id=$2', [fullName, userId]);
      await auditLog({ tenantId: target.tenant_id, userId: req.user.id, action: 'UPDATE_SELF', entityType: 'user', entityId: userId });
      return ok(res, { id: userId, fullName, role: target.role, updatedAt: new Date().toISOString() }, 'User updated successfully');
    }

    if (!(req.user.role === 'tenant_admin' && sameTenant)) return forbidden(res);

    const newRole = typeof role !== 'undefined' ? role : target.role;
    const newActive = typeof isActive !== 'undefined' ? isActive : true;
    const newName = typeof fullName !== 'undefined' ? fullName : undefined;

    await query('UPDATE users SET full_name=COALESCE($1, full_name), role=$2, is_active=$3, updated_at=NOW() WHERE id=$4',
      [newName, newRole, newActive, userId]);

    await auditLog({ tenantId: target.tenant_id, userId: req.user.id, action: 'UPDATE_USER', entityType: 'user', entityId: userId });
    return ok(res, { id: userId, fullName: newName ?? undefined, role: newRole, updatedAt: new Date().toISOString() }, 'User updated successfully');
  } catch (e) { return next(e); }
}

export async function deleteUser(req, res, next) {
  const { userId } = req.params;
  try {
    const { rows } = await query('SELECT id, tenant_id FROM users WHERE id=$1', [userId]);
    const target = rows[0];
    if (!target) return notFound(res, 'User not found');
    if (!(req.user.role === 'tenant_admin' && req.user.tenantId === target.tenant_id)) return forbidden(res);
    if (req.user.id === userId) return forbidden(res, 'Cannot delete yourself');

    // unassign tasks
    await query('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1', [userId]);
    await query('DELETE FROM users WHERE id=$1', [userId]);

    await auditLog({ tenantId: target.tenant_id, userId: req.user.id, action: 'DELETE_USER', entityType: 'user', entityId: userId });
    return ok(res, null, 'User deleted successfully');
  } catch (e) { return next(e); }
}
