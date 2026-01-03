/**
 * Database Initialization and Seeding Module
 * 
 * Handles database schema migrations and initial data seeding.
 * Implements a migration tracking system to apply SQL migrations in order.
 * 
 * @module init
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { pool, query, withTransaction } from './db.js';

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing SQL migration files
const migrationsDir = path.join(__dirname, 'migrations');

/**
 * Ensure Migrations Tracking Table Exists
 * 
 * Creates the _migrations table if it doesn't exist.
 * This table tracks which migration files have been applied.
 * 
 * @async
 * @private
 */
async function ensureMigrationsTable() {
  await query(`CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

/**
 * Get Set of Applied Migrations
 * 
 * Retrieves the list of migration files that have already been applied.
 * 
 * @async
 * @private
 * @returns {Promise<Set<string>>} Set of applied migration filenames
 */
async function appliedMigrations() {
  const { rows } = await query('SELECT filename FROM _migrations ORDER BY id');
  return new Set(rows.map(r => r.filename));
}

/**
 * Run Database Migrations
 * 
 * Applies all pending SQL migration files in alphabetical order.
 * Each migration runs in a transaction to ensure atomicity.
 * 
 * @async
 * @export
 * @throws {Error} If any migration fails to apply
 */
export async function runMigrations() {
  await ensureMigrationsTable();
  const applied = await appliedMigrations();

  // Read and sort all .sql files from migrations directory
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Apply each pending migration
  for (const file of files) {
    if (applied.has(file)) continue; // Skip already applied migrations

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    // Run migration and record it in a transaction
    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    });

    console.log('Applied migration:', file);
  }
}

/**
 * Seed Initial Data if Needed
 * 
 * Seeds the database with initial data from submission.json if not already seeded.
 * Creates super admin, tenants, users, projects, and tasks.
 * 
 * @async
 * @private
 */
async function seedIfNeeded() {
  // Check if database is already seeded by looking for super admin
  const { rows } = await query("SELECT id FROM users WHERE role='super_admin' LIMIT 1");
  if (rows[0]) return; // Already seeded, skip

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

/**
 * Initialize Database and Seed Data
 * 
 * Main initialization function that runs migrations and seeds data.
 * Called during application startup.
 * 
 * @async
 * @export
 */
export async function initDatabaseAndSeed() {
  await runMigrations();
  await seedIfNeeded();
}

/**
 * Check Database Readiness
 * 
 * Verifies that the database is accessible and properly initialized.
 * Used for health checks and startup validation.
 * 
 * @async
 * @export
 * @returns {Promise<boolean>} True if database is ready, false otherwise
 */
export async function checkReadiness() {
  try {
    // Test basic connectivity
    await pool.query('SELECT 1');

    // Verify that migrations have been applied
    await pool.query("SELECT to_regclass('public.tenants')");

    return true;
  } catch (e) {
    return false;
  }
}
