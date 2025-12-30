import { query } from '../db.js';
import { created, ok, forbidden, notFound } from '../utils/responses.js';
import { auditLog } from '../utils/audit.js';

function isTenantAdmin(req) { return req.user?.role === 'tenant_admin'; }

export async function createProject(req, res, next) {
  const { name, description = '', status = 'active' } = req.body;
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) return forbidden(res);

    // check project limits
    const t = await query('SELECT max_projects FROM tenants WHERE id=$1', [tenantId]);
    const max = t.rows[0]?.max_projects || 0;
    const cnt = await query('SELECT COUNT(*)::int AS c FROM projects WHERE tenant_id=$1', [tenantId]);
    if (cnt.rows[0].c >= max) return forbidden(res, 'Project limit reached');

    const { rows } = await query(
      `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, tenant_id, name, description, status, created_by, created_at`,
      [tenantId, name, description, status, req.user.id]
    );

    await auditLog({ tenantId, userId: req.user.id, action: 'CREATE_PROJECT', entityType: 'project', entityId: rows[0].id });
    return created(res, {
      id: rows[0].id,
      tenantId: rows[0].tenant_id,
      name: rows[0].name,
      description: rows[0].description,
      status: rows[0].status,
      createdBy: rows[0].created_by,
      createdAt: rows[0].created_at,
    });
  } catch (e) { return next(e); }
}

export async function listProjects(req, res, next) {
  const { status, search = '', page = '1', limit = '20' } = req.query;
  try {
    const tenantId = req.user.tenantId;
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (p - 1) * l;

    const clauses = ['p.tenant_id = $1'];
    const params = [tenantId];
    if (status) { params.push(status); clauses.push(`p.status = $${params.length}`); }
    if (search) { params.push(`%${search.toLowerCase()}%`); clauses.push(`LOWER(p.name) LIKE $${params.length}`); }

    const where = clauses.join(' AND ');
    const list = await query(
      `SELECT p.id, p.name, p.description, p.status, p.created_at,
              u.id as creator_id, u.full_name as creator_name,
              (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
              (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status='completed') as completed_task_count
       FROM projects p
       JOIN users u ON u.id = p.created_by
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, l, offset]
    );

    const count = await query(`SELECT COUNT(*)::int AS c FROM projects p WHERE ${where}`, params);

    return ok(res, {
      projects: list.rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        status: r.status,
        createdBy: { id: r.creator_id, fullName: r.creator_name },
        taskCount: Number(r.task_count || 0),
        completedTaskCount: Number(r.completed_task_count || 0),
        createdAt: r.created_at,
      })),
      total: count.rows[0].c,
      pagination: { currentPage: p, totalPages: Math.ceil(count.rows[0].c / l), limit: l }
    });
  } catch (e) { return next(e); }
}

export async function updateProject(req, res, next) {
  const { projectId } = req.params;
  const { name, description, status } = req.body;
  try {
    const { rows } = await query('SELECT id, tenant_id, created_by FROM projects WHERE id=$1', [projectId]);
    const p = rows[0];
    if (!p) return notFound(res, 'Project not found');
    if (p.tenant_id !== req.user.tenantId) return forbidden(res);
    if (!(req.user.role === 'tenant_admin' || req.user.id === p.created_by)) return forbidden(res);

    await query('UPDATE projects SET name=COALESCE($1, name), description=COALESCE($2, description), status=COALESCE($3, status), updated_at=NOW() WHERE id=$4',
      [name, description, status, projectId]);

    await auditLog({ tenantId: p.tenant_id, userId: req.user.id, action: 'UPDATE_PROJECT', entityType: 'project', entityId: projectId });
    return ok(res, { id: projectId, name, description, status, updatedAt: new Date().toISOString() }, 'Project updated successfully');
  } catch (e) { return next(e); }
}

export async function deleteProject(req, res, next) {
  const { projectId } = req.params;
  try {
    const { rows } = await query('SELECT id, tenant_id, created_by FROM projects WHERE id=$1', [projectId]);
    const p = rows[0];
    if (!p) return notFound(res, 'Project not found');
    if (p.tenant_id !== req.user.tenantId) return forbidden(res);
    if (!(req.user.role === 'tenant_admin' || req.user.id === p.created_by)) return forbidden(res);

    await query('DELETE FROM projects WHERE id=$1', [projectId]);
    await auditLog({ tenantId: p.tenant_id, userId: req.user.id, action: 'DELETE_PROJECT', entityType: 'project', entityId: projectId });
    return ok(res, null, 'Project deleted successfully');
  } catch (e) { return next(e); }
}
