import prisma from "../db/prisma";

interface CreateAuditLogInput {
  actorUserId?: string | null;
  targetUserId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}

export const createAuditLog = async ({
  actorUserId = null,
  targetUserId = null,
  action,
  metadata,
}: CreateAuditLogInput) => {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        actorUserId,
        targetUserId,
        action,
        metadata: metadata ?? undefined,
      },
    });

    console.log("Audit log created:", auditLog.id);

    return auditLog;
  } catch (error) {
    console.error("AUDIT LOG CREATION FAILED:", error);

    throw error;
  }
};