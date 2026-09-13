import type {
  AuditAction,
  AuditCategory,
} from "./audit.constants";

export interface AuditLogInput {
  actorUserId?: string | null;
  targetUserId?: string | null;

  action: AuditAction;
  category: AuditCategory;

  entityType?: string | null;
  entityId?: string | null;

  description?: string | null;

  metadata?: Record<string, unknown> | null;

  sessionId?: string | null;

  ipAddress?: string | null;
  userAgent?: string | null;

  country?: string | null;
  state?: string | null;
  city?: string | null;
  timezone?: string | null;
}

export interface AuditRequestContext {
  userId?: string | null;
  sessionId?: string | null;

  ipAddress?: string | null;
  userAgent?: string | null;

  country?: string | null;
  state?: string | null;
  city?: string | null;
  timezone?: string | null;
}