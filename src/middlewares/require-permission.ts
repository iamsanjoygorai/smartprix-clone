import { Request, Response, NextFunction } from "express";
import prisma from "../db/prisma";
import type { Permission } from "../config/permissions";

export const requirePermission = (
  permission: Permission,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          userPermissions: {
            include: {
              permission: true,
            },
          },
          userRoles: {
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
          },
        },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      /*
       * SUPER_ADMIN always has full access.
       */
      if (user.role === "SUPER_ADMIN") {
        return next();
      }

      /*
       * Check for an individual user override first.
       *
       * allowed = true  -> explicitly allow
       * allowed = false -> explicitly deny
       */
      const userOverride =
  user.userPermissions.find(
    (item) =>
      item.permission.name === permission,
  );

console.log("PERMISSION CHECK:", {
  userId,
  permission,
  role: user.role,
  override: userOverride
    ? {
        permission: userOverride.permission.name,
        allowed: userOverride.allowed,
      }
    : null,
});

      if (userOverride) {
        if (!userOverride.allowed) {
          return res.status(403).json({
            success: false,
            message: "Permission denied",
          });
        }

        return next();
      }

      /*
       * No individual override.
       * Fall back to role permissions.
       */
      const hasRolePermission =
        user.userRoles.some((userRole) =>
          userRole.role.permissions.some(
            (rolePermission) =>
              rolePermission.permission.name ===
              permission,
          ),
        );

      if (!hasRolePermission) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }

      return next();
    } catch (error) {
      console.error(
        "Permission middleware error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
};