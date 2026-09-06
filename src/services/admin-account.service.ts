import bcrypt from "bcryptjs";
import prisma from "../db/prisma";

interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export const changeAdminPassword = async ({
  userId,
  currentPassword,
  newPassword,
}: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.passwordHash) {
    throw new Error("Password is not configured for this account");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("Current password is incorrect");
  }

  const isSamePassword = await bcrypt.compare(
    newPassword,
    user.passwordHash,
  );

  if (isSamePassword) {
    throw new Error(
      "New password must be different from your current password",
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
    },
  });

  return {
    success: true,
  };
};
