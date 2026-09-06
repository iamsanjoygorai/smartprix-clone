
import bcrypt from "bcryptjs";

import prisma from "../db/prisma";

import { generateToken } from "../config/jwt";

import type { LoginInput } from "../validators/auth.validator";

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  if (user.isDisabled) {
    throw new Error("Account is disabled");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: user.id,
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const permissions = Array.from(
    new Set(
      userRoles.flatMap((userRole) =>
        userRole.role.permissions.map(
          (rolePermission) =>
            rolePermission.permission.name,
        ),
      ),
    ),
  );

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions,
    },
  };
};