/**
 * Simple audit logging for admin actions
 * In production, this should write to a database table or external service
 */

export type AuditAction =
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'USER_ROLE_CHANGED'
  | 'BOAT_DELETED'
  | 'BOAT_STATUS_CHANGED';

interface AuditLogEntry {
  action: AuditAction;
  adminId: string;
  adminEmail: string;
  targetId: string;
  targetType: 'user' | 'boat';
  details: Record<string, any>;
  timestamp: Date;
  ip?: string;
}

export function logAdminAction(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const fullEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date()
  };

  // In development, log to console
  console.log('[AUDIT LOG]', JSON.stringify(fullEntry, null, 2));

  // TODO: In production, save to database:
  // await prisma.auditLog.create({ data: fullEntry });
}
