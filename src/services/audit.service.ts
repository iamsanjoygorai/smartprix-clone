import {
  createAuditLog as createCentralAuditLog,
} from "../modules/audit/audit.service";

import type { AuditLogInput } from "../modules/audit/audit.types";

interface LegacyCreateAuditLogInput {
  actorUserId: string;
  targetUserId?: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export const createAuditLog = async ({
  actorUserId,
  targetUserId,
  action,
  metadata,
}: LegacyCreateAuditLogInput) => {
  return createCentralAuditLog({
    actorUserId,
    targetUserId,
    action: action as AuditLogInput["action"],
    category: "SYSTEM",
    metadata: metadata ?? {},
  });
};