import { query, withTransaction } from '../db.js';
import { ok, notFound, forbidden, badRequest } from '../utils/responses.js';
import { auditLog } from '../utils/audit.js';

function isSuper(req) { return req.user?.role === 'super_admin'; }

export async function getTenantDetails(req, res, next) {
  const { tenantId } = req.params;
  try {
    const { rows } = await query('SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at FROM tenants WHERE id=$1', [tenantId]);
    const t = rows[0];
    if (!t) return notFound(res, 'Tenant not found');
    // stats
    const uCount = await query('SELECT COUNT(*)::int AS c FROM users WHERE tenant_id=$1', [tenantId]);
    const pCount = await query('SELECT COUNT(*)::int AS c FROM projects WHERE tenant_id=$1', [tenantId]);
    const taskCount = await query('SELECT COUNT(*)::int AS c FROM tasks WHERE tenant_id=$1', [tenantId]);

    return ok(res, {
      id: t.id,
      name: t.name,
      subdomain: t.subdomain,
      status: t.status,
      subscriptionPlan: t.subscription_plan,
      maxUsers: t.max_users,
      maxProjects: t.max_projects,
      createdAt: t.created_at,
      stats: { totalUsers: uCount.rows[0].c, totalProjects: pCount.rows[0].c, totalTasks: taskCount.rows[0].c }
    });
  } catch (e) { return next(e); }
}

export async function updateTenant(req, res, next) {
  const { tenantId } = req.params;
  const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;
  try {
    const { rows } = await query('SELECT * FROM tenants WHERE id=$1', [tenantId]);
    const t = rows[0];
    if (!t) return notFound(res, 'Tenant not found');

    if (!isSuper(req)) {
      if (status || subscriptionPlan || maxUsers || maxProjects) {
        return forbidden(res, 'Only super_admin can update plan/status/limits');
      }
      if (typeof name === 'undefined') {
        return badRequest(res, 'Nothing to update');
      }
    }

    const newName = (typeof name !== 'undefined') ? name : t.name;
    const newStatus = isSuper(req) && status ? status : t.status;
    const newPlan = isSuper(req) && subscriptionPlan ? subscriptionPlan : t.subscription_plan;
    const newMaxUsers = isSuper(req) && maxUsers ? maxUsers : t.max_users;
    const newMaxProjects = isSuper(req) && maxProjects ? maxProjects : t.max_projects;

    await query(`UPDATE tenants SET name=$1, status=$2, subscription_plan=$3, max_users=$4, max_projects=$5, updated_at=NOW() WHERE id=$6`,
      [newName, newStatus, newPlan, newMaxUsers, newMaxProjects, tenantId]);

    await auditLog({ tenantId, userId: req.user.id, action: 'UPDATE_TENANT', entityType: 'tenant', entityId: tenantId });
    return ok(res, { id: tenantId, name: newName, updatedAt: new Date().toISOString() }, 'Tenant updated successfully');
  } catch (e) { return next(e); }
}

export async function listTenants(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
    const offset = (page - 1) * limit;
    const status = req.query.status || null;
    const plan = req.query.subscriptionPlan || null;

    const where = [];
    const params = [];
    if (status) { params.push(status); where.push(`status = $${params.length}`); }
    if (plan) { params.push(plan); where.push(`subscription_plan = $${params.length}`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const listSql = `SELECT id, name, subdomain, status, subscription_plan, created_at FROM tenants ${whereSql} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);
    const { rows } = await query(listSql, params);

    // totals
    const countSql = `SELECT COUNT(*)::int AS c FROM tenants ${whereSql}`;
    const { rows: countRows } = await query(countSql, where.length ? params.slice(0, where.length) : []);
    const total = countRows[0].c;

    // enrich with stats
    const enriched = await Promise.all(rows.map(async (t) => {
      const u = await query('SELECT COUNT(*)::int AS c FROM users WHERE tenant_id=$1', [t.id]);
      const p = await query('SELECT COUNT(*)::int AS c FROM projects WHERE tenant_id=$1', [t.id]);
      return {
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        status: t.status,
        subscriptionPlan: t.subscription_plan,
        totalUsers: u.rows[0].c,
        totalProjects: p.rows[0].c,
        createdAt: t.created_at,
      };
    }));

    return ok(res, {
      tenants: enriched,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTenants: total,
        limit,
      }
    });
  } catch (e) { return next(e); }
}
