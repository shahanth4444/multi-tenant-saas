/**
 * Audit Logging Utility
 * 
 * Provides functions to log user actions and system events for compliance and security.
 * Audit logs track who did what, when, and on which resources.
 * 
 * @module utils/audit
 */

import { query } from '../db.js';

/**
 * Log an Audit Event
 * 
 * Records an action in the audit_logs table for compliance and security tracking.
 * Failures to log are caught and logged to stderr to avoid disrupting application flow.
 * 
 * @async
 * @param {Object} params - Audit log parameters
 * @param {number|null} params.tenantId - ID of the tenant (null for super admin actions)
 * @param {number|null} params.userId - ID of the user performing the action
 * @param {string} params.action - Action being performed (e.g., 'LOGIN', 'CREATE_PROJECT')
 * @param {string|null} params.entityType - Type of entity affected (e.g., 'user', 'project')
 * @param {number|null} params.entityId - ID of the affected entity
 * @param {string|null} params.ipAddress - IP address of the user
 * 
 * @example
 * await auditLog({
 *   tenantId: 1,
 *   userId: 5,
 *   action: 'DELETE_PROJECT',
 *   entityType: 'project',
 *   entityId: 42,
 *   ipAddress: '192.168.1.1'
 * });
 */
export async function auditLog({ tenantId = null, userId = null, action, entityType = null, entityId = null, ipAddress = null }) {
  try {
    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [tenantId, userId, action, entityType, entityId, ipAddress]
    );
  } catch (e) {
    // Avoid throwing from audit; log to stderr instead to prevent disrupting normal flow
    console.error('Audit log error:', e.message);
  }
}
