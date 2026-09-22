import { getCollection } from '@/lib/db/mongodb';
import { v4 as uuidv4 } from 'uuid';

/**
 * Logs an administrative event to the tamper-evident audit_logs collection.
 * 
 * @param {Object} params
 * @param {string} params.action - e.g., 'PRODUCT_PRICE_CHANGE', 'PRODUCT_DELETE', 'EMPLOYEE_CREATED', etc.
 * @param {Object} params.actor - { id, email, name, role }
 * @param {string} params.targetType - 'product' | 'category' | 'order' | 'employee' | 'approval' | 'settings'
 * @param {string} params.targetId - target entity ID
 * @param {string} [params.targetName] - Human-readable name or label
 * @param {Object} [params.details] - Structured metadata before/after, changes, reason
 * @param {string} [params.status='SUCCESS'] - 'SUCCESS' | 'PENDING_APPROVAL' | 'FAILED' | 'REJECTED'
 * @param {string} [params.ipAddress] - IP address of the caller
 */
export async function logAuditEvent({
  action,
  actor,
  targetType,
  targetId,
  targetName = '',
  details = {},
  status = 'SUCCESS',
  ipAddress = 'internal'
}) {
  try {
    const auditCol = await getCollection('audit_logs');
    const entry = {
      _id: uuidv4(),
      action,
      actor: {
        id: actor?.id || actor?._id || 'system',
        email: actor?.email || 'system',
        name: actor?.name || 'System',
        role: actor?.role || 'system'
      },
      targetType,
      targetId: String(targetId || ''),
      targetName,
      details,
      status,
      ipAddress,
      timestamp: new Date().toISOString()
    };

    await auditCol.insertOne(entry);
    return entry;
  } catch (error) {
    console.error('[Audit Log] Failed to write audit event:', error);
    return null;
  }
}
