import prisma from "../../db/prisma";

import historyService from "../history/history.service";
import {
  HISTORY_CATEGORY,
  HISTORY_EVENTS,
  HISTORY_OPERATION,
} from "../history/history.constants";

export const deleteAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      isDeleted: true,
      isDisabled: true,
      deletedAt: true,
      deletionReason: true,
      name: true,
      email: true,
      mobile: true,
      profileImageUrl: true,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    (error as any).statusCode = 404;
    throw error;
  }

  if (user.role === "SUPER_ADMIN") {
    const error = new Error(
      "Super Admin account cannot be deleted",
    );

    (error as any).statusCode = 403;
    throw error;
  }

  if (user.isDeleted) {
    const error = new Error("Account has already been deleted");
    (error as any).statusCode = 400;
    throw error;
  }

  const deletedAt = new Date();

  await prisma.$transaction(async (tx) => {
    /*
     * =========================================================
     * BEFORE STATE
     * =========================================================
     */

    const before = {
      id: user.id,
      role: user.role,
      isDisabled: user.isDisabled,
      isDeleted: user.isDeleted,
      deletedAt: user.deletedAt,
      deletionReason: user.deletionReason,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profileImageUrl: user.profileImageUrl,
    };

    /*
     * =========================================================
     * AUDIT LOG
     * =========================================================
     */

    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        targetUserId: userId,
        action: "USER_DELETED",
        category: "USER",
        entityType: "User",
        entityId: userId,
        metadata: {
          reason: "User requested account deletion",
          deletedAt: deletedAt.toISOString(),
        },
      },
    });

    /*
     * =========================================================
     * SOFT DELETE
     * =========================================================
     *
     * The User row is NEVER physically deleted.
     */

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        isDeleted: true,
        isDisabled: true,
        deletedAt,
        deletionReason: "User requested account deletion",

        // Invalidate password-reset mechanisms.
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,

        passwordResetCodeHash: null,
        passwordResetCodeExpiresAt: null,
        passwordResetCodeAttempts: 0,
        passwordResetCodeSentAt: null,
        passwordResetOtpSessionId: null,
      },
    });

    /*
     * =========================================================
     * AFTER STATE
     * =========================================================
     */

    const after = {
      id: user.id,
      role: user.role,
      isDisabled: true,
      isDeleted: true,
      deletedAt,
      deletionReason: "User requested account deletion",
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profileImageUrl: user.profileImageUrl,
    };

    /*
     * =========================================================
     * GIT-LIKE HISTORY
     * =========================================================
     */

    await historyService.recordChange(
      {
        actorUserId: userId,
        targetUserId: userId,

        category: HISTORY_CATEGORY.USER,

        eventType: HISTORY_EVENTS.USER_DELETED,

        operation: HISTORY_OPERATION.DELETE,

        entityType: "User",
        entityId: userId,

        title: "Account deleted",

        description:
          "User requested account deletion. The account was soft-deleted and disabled.",

        before,
        after,

        metadata: {
          reason: "User requested account deletion",
          deletedAt: deletedAt.toISOString(),
        },

        createSnapshot: true,
      },
      tx,
    );
  });
};


