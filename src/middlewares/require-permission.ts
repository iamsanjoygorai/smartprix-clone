import type {
  NextFunction,
  Request,
  Response,
} from "express";

import prisma from "../db/prisma";

export const requirePermission = (
  permissionName: string,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const userRoles =
        await prisma.userRole.findMany({
          where: {
            userId: req.user.userId,
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

      const hasPermission =
        userRoles.some((userRole) =>
          userRole.role.permissions.some(
            (rolePermission) =>
              rolePermission.permission.name ===
              permissionName,
          ),
        );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      console.error(
        "Permission middleware error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Unable to verify permissions",
      });
    }
  };
};