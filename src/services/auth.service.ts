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

  /*
   * Start with permissions provided by the user's role(s).
   */
  const effectivePermissions = new Set<string>(
    userRoles.flatMap((userRole) =>
      userRole.role.permissions.map(
        (rolePermission) =>
          rolePermission.permission.name,
      ),
    ),
  );

  /*
   * SUPER_ADMIN always has every permission.
   */
  if (user.role === "SUPER_ADMIN") {
    const allPermissions =
      await prisma.permission.findMany({
        select: {
          name: true,
        },
      });

    for (const permission of allPermissions) {
      effectivePermissions.add(permission.name);
    }
  } else {
    /*
     * Apply individual user overrides.
     *
     * allowed = true  -> add permission
     * allowed = false -> remove permission
     */
    const userOverrides =
      await prisma.userPermission.findMany({
        where: {
          userId: user.id,
        },
        include: {
          permission: true,
        },
      });

    for (const override of userOverrides) {
      if (override.allowed) {
        effectivePermissions.add(
          override.permission.name,
        );
      } else {
        effectivePermissions.delete(
          override.permission.name,
        );
      }
    }
  }

  const permissions = Array.from(
    effectivePermissions,
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