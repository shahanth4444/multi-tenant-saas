import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { pool, query, withTransaction } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'migrations');

async function ensureMigrationsTable() {
  await query(`CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

async function appliedMigrations() {
  const { rows } = await query('SELECT filename FROM _migrations ORDER BY id');
  return new Set(rows.map(r => r.filename));
}

export async function runMigrations() {
  await ensureMigrationsTable();
  const applied = await appliedMigrations();
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    });
    console.log('Applied migration:', file);
  }
}

async function seedIfNeeded() {
  // Check for super admin existence
  const { rows } = await query("SELECT id FROM users WHERE role='super_admin' LIMIT 1");
  if (rows[0]) return; // already seeded

  const submissionPath = path.join(__dirname, '..', 'submission.json');
  const raw = fs.readFileSync(submissionPath, 'utf-8');
  const submission = JSON.parse(raw);
  const creds = submission.testCredentials;

  await withTransaction(async (client) => {
    // Super admin (tenant_id = NULL)
    const superHash = await bcrypt.hash(creds.superAdmin.password, 10);
    const superRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES (NULL, $1, $2, $3, 'super_admin') RETURNING id`,
      [creds.superAdmin.email, superHash, 'Super Admin']
    );

    for (const t of creds.tenants) {
      // Plan defaults
      const plan = t.subscriptionPlan || 'free';
      const limits = plan === 'enterprise' ? { users: 100, projects: 50 } : plan === 'pro' ? { users: 25, projects: 15 } : { users: 5, projects: 3 };

      const tenantRes = await client.query(
        `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [t.name, t.subdomain, t.status || 'active', plan, limits.users, limits.projects]
      );
      const tenantId = tenantRes.rows[0].id;

      // Admin user
      const adminHash = await bcrypt.hash(t.admin.password, 10);
      const adminRes = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
         VALUES ($1,$2,$3,$4,'tenant_admin') RETURNING id`,
        [tenantId, t.admin.email, adminHash, 'Tenant Admin']
      );
      const adminId = adminRes.rows[0].id;

      // Regular users
      for (const u of (t.users || [])) {
        const hash = await bcrypt.hash(u.password, 10);
        await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
           VALUES ($1,$2,$3,$4,$5)`,
          [tenantId, u.email, hash, 'User', u.role || 'user']
        );
      }

      // Projects
      for (const p of (t.projects || [])) {
        const projRes = await client.query(
          `INSERT INTO projects (tenant_id, name, description, status, created_by)
           VALUES ($1,$2,$3,'active',$4) RETURNING id`,
          [tenantId, p.name, p.description || '', adminId]
        );
        const projectId = projRes.rows[0].id;
        // Seed a sample task per project
        await client.query(
          `INSERT INTO tasks (project_id, tenant_id, title, description, status, priority)
           VALUES ($1,$2,$3,$4,'todo','medium')`,
          [projectId, tenantId, 'Initial task', 'Seed task']
        );
      }
    }
  });
}

export async function initDatabaseAndSeed() {
  await runMigrations();
  await seedIfNeeded();
}

export async function checkReadiness() {
  try {
    await pool.query('SELECT 1');
    // Confirm at least tenants table exists
    await pool.query("SELECT to_regclass('public.tenants')");
    return true;
  } catch (e) {
    return false;
  }
}
