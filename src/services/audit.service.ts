import prisma from "../db/prisma";

interface CreateAuditLogInput {
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
}: CreateAuditLogInput) => {
  return prisma.auditLog.create({
    data: {
      actorUserId,
      targetUserId: targetUserId ?? null,
      action,
      metadata: metadata ?? {},
    },
  });
};