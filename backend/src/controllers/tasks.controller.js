import { query } from '../db.js';
import { created, ok, forbidden, notFound, badRequest } from '../utils/responses.js';
import { auditLog } from '../utils/audit.js';

export async function createTask(req, res, next) {
  const { projectId } = req.params;
  const { title, description = '', assignedTo = null, priority = 'medium', dueDate = null } = req.body;
  try {
    const p = await query('SELECT id, tenant_id FROM projects WHERE id=$1', [projectId]);
    const project = p.rows[0];
    if (!project) return notFound(res, 'Project not found');
    if (project.tenant_id !== req.user.tenantId) return forbidden(res);

    if (assignedTo) {
      const u = await query('SELECT id FROM users WHERE id=$1 AND tenant_id=$2', [assignedTo, project.tenant_id]);
      if (!u.rows[0]) return badRequest(res, 'assignedTo must belong to same tenant');
    }

    const { rows } = await query(
      `INSERT INTO tasks (project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
       VALUES ($1,$2,$3,$4,'todo',$5,$6,$7) RETURNING id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at`,
      [projectId, project.tenant_id, title, description, priority, assignedTo, dueDate]
    );

    await auditLog({ tenantId: project.tenant_id, userId: req.user.id, action: 'CREATE_TASK', entityType: 'task', entityId: rows[0].id });
    return created(res, rows[0]);
  } catch (e) { return next(e); }
}

export async function listProjectTasks(req, res, next) {
  const { projectId } = req.params;
  const { status, assignedTo, priority, search = '', page = '1', limit = '50' } = req.query;
  try {
    const p = await query('SELECT id, tenant_id FROM projects WHERE id=$1', [projectId]);
    const project = p.rows[0];
    if (!project) return notFound(res, 'Project not found');
    if (project.tenant_id !== req.user.tenantId) return forbidden(res);

    const P = Math.max(1, parseInt(page, 10));
    const L = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (P - 1) * L;

    const clauses = ['t.project_id = $1'];
    const params = [projectId];
    if (status) { params.push(status); clauses.push(`t.status = $${params.length}`); }
    if (assignedTo) { params.push(assignedTo); clauses.push(`t.assigned_to = $${params.length}`); }
    if (priority) { params.push(priority); clauses.push(`t.priority = $${params.length}`); }
    if (search) { params.push(`%${search.toLowerCase()}%`); clauses.push(`LOWER(t.title) LIKE $${params.length}`); }

    const where = clauses.join(' AND ');
    const list = await query(
      `SELECT t.id, t.title, t.description, t.status, t.priority, t.assigned_to, t.due_date, t.created_at,
              u.id as user_id, u.full_name as user_name, u.email as user_email
       FROM tasks t
       LEFT JOIN users u ON u.id = t.assigned_to
       WHERE ${where}
       ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, t.due_date NULLS LAST
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, L, offset]
    );
    const count = await query(`SELECT COUNT(*)::int AS c FROM tasks t WHERE ${where}`, params);

    return ok(res, {
      tasks: list.rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        priority: r.priority,
        assignedTo: r.user_id ? { id: r.user_id, fullName: r.user_name, email: r.user_email } : null,
        dueDate: r.due_date,
        createdAt: r.created_at,
      })),
      total: count.rows[0].c,
      pagination: { currentPage: P, totalPages: Math.ceil(count.rows[0].c / L), limit: L }
    });
  } catch (e) { return next(e); }
}

export async function updateTaskStatus(req, res, next) {
  const { taskId } = req.params;
  const { status } = req.body;
  try {
    const { rows } = await query('SELECT id, tenant_id FROM tasks WHERE id=$1', [taskId]);
    const t = rows[0];
    if (!t) return notFound(res, 'Task not found');
    if (t.tenant_id !== req.user.tenantId) return forbidden(res);

    const upd = await query('UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id, status, updated_at', [status, taskId]);
    await auditLog({ tenantId: t.tenant_id, userId: req.user.id, action: 'UPDATE_TASK_STATUS', entityType: 'task', entityId: taskId });
    return ok(res, { id: upd.rows[0].id, status: upd.rows[0].status, updatedAt: upd.rows[0].updated_at });
  } catch (e) { return next(e); }
}

export async function updateTask(req, res, next) {
  const { taskId } = req.params;
  const { title, description, status, priority, assignedTo = undefined, dueDate = undefined } = req.body;
  try {
    const { rows } = await query('SELECT id, tenant_id, project_id FROM tasks WHERE id=$1', [taskId]);
    const t = rows[0];
    if (!t) return notFound(res, 'Task not found');
    if (t.tenant_id !== req.user.tenantId) return forbidden(res);

    if (assignedTo !== undefined && assignedTo !== null) {
      const u = await query('SELECT id FROM users WHERE id=$1 AND tenant_id=$2', [assignedTo, t.tenant_id]);
      if (!u.rows[0]) return badRequest(res, 'assignedTo must belong to same tenant');
    }

    await query(
      `UPDATE tasks SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority),
        assigned_to = $5,
        due_date = $6,
        updated_at = NOW()
       WHERE id=$7`,
      [title ?? null, description ?? null, status ?? null, priority ?? null, assignedTo ?? null, dueDate ?? null, taskId]
    );

    const det = await query(
      `SELECT t.id, t.title, t.description, t.status, t.priority, t.assigned_to, t.due_date, t.updated_at,
              u.id as user_id, u.full_name as user_name, u.email as user_email
       FROM tasks t LEFT JOIN users u ON u.id = t.assigned_to WHERE t.id=$1`,
      [taskId]
    );

    await auditLog({ tenantId: t.tenant_id, userId: req.user.id, action: 'UPDATE_TASK', entityType: 'task', entityId: taskId });

    const r = det.rows[0];
    return ok(res, {
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      assignedTo: r.user_id ? { id: r.user_id, fullName: r.user_name, email: r.user_email } : null,
      dueDate: r.due_date,
      updatedAt: r.updated_at,
    }, 'Task updated successfully');
  } catch (e) { return next(e); }
}
