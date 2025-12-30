import { query } from '../db.js';

export async function auditLog({ tenantId = null, userId = null, action, entityType = null, entityId = null, ipAddress = null }) {
  try {
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [tenantId, userId, action, entityType, entityId, ipAddress]
    );
  } catch (e) {
    // Avoid throwing from audit; log to stderr instead
    console.error('Audit log error:', e.message);
  }
}
