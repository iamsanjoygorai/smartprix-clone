import prisma from "../../db/prisma";

export const deleteAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      isDeleted: true,
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
    // Keep a permanent record of the deletion.
    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        targetUserId: userId,
        action: "USER_DELETED",
        metadata: {
          reason: "User requested account deletion",
          deletedAt: deletedAt.toISOString(),
        },
      },
    });

    // Soft-delete the account.
    // The User row is NEVER physically deleted.
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
  });
};