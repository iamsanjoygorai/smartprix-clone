import prisma from "../../db/prisma";
import type {
  AuditLogInput,
  AuditRequestContext,
} from "./audit.types";

/**
 * Create a permanent audit log entry.
 */
export async function createAuditLog(
  input: AuditLogInput,
) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      targetUserId: input.targetUserId ?? null,

      action: input.action,
      category: input.category,

      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,

      description: input.description ?? null,

      metadata: input.metadata
  ? JSON.parse(JSON.stringify(input.metadata))
  : undefined,

      sessionId: input.sessionId ?? null,

      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,

      country: input.country ?? null,
      state: input.state ?? null,
      city: input.city ?? null,
      timezone: input.timezone ?? null,
    },
  });
}

/**
 * Create an audit log using request/session context.
 */
export async function createAuditLogWithContext(
  input: Omit<
    AuditLogInput,
    | "actorUserId"
    | "sessionId"
    | "ipAddress"
    | "userAgent"
    | "country"
    | "state"
    | "city"
    | "timezone"
  >,
  context: AuditRequestContext,
) {
  return createAuditLog({
    ...input,
    actorUserId: context.userId ?? null,
    sessionId: context.sessionId ?? null,

    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,

    country: context.country ?? null,
    state: context.state ?? null,
    city: context.city ?? null,
    timezone: context.timezone ?? null,
  });
}