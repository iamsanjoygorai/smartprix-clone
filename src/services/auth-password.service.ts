import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../db/prisma";
import { sendPasswordResetEmail } from "./email.service";

export const requestPasswordReset = async (
  email: string,
  clientUrl: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase().trim(),
    },
    select: {
      id: true,
      email: true,
    },
  });

  /*
   * Always return successfully.
   *
   * This prevents attackers from discovering
   * whether an email exists in the database.
   */
  if (!user) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const resetExpiresAt = new Date(
    Date.now() + 15 * 60 * 1000,
  );

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      resetPasswordTokenHash: resetTokenHash,
      resetPasswordExpiresAt: resetExpiresAt,
    },
  });

  const resetUrl =
    `${clientUrl}/reset-password?token=${resetToken}`;

  await sendPasswordResetEmail(
    user.email,
    resetUrl,
  );
};

export const resetPassword = async (
  token: string,
  newPassword: string,
) => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new Error(
      "Password reset link is invalid or expired",
    );
  }

  if (user.passwordHash) {
    const samePassword = await bcrypt.compare(
      newPassword,
      user.passwordHash,
    );

    if (samePassword) {
      throw new Error(
        "New password must be different from your current password",
      );
    }
  }

  const passwordHash = await bcrypt.hash(
    newPassword,
    12,
  );

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash,
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
    },
  });
};