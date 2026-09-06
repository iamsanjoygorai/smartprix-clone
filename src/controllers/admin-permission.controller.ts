import { Request, Response } from "express";
import prisma from "../db/prisma";
import { createAuditLog } from "../services/audit.service";

export const getUserPermissions = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const permissions = await prisma.permission.findMany({
      orderBy: {
        name: "asc",
      },
    });

    const overrides =
      await prisma.userPermission.findMany({
        where: {
          userId: id,
        },
        include: {
          permission: true,
        },
      });

    const overrideMap = new Map(
      overrides.map((item) => [
        item.permission.name,
        item.allowed,
      ]),
    );

    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: id,
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

    const rolePermissions = new Set(
      userRoles.flatMap((userRole) =>
        userRole.role.permissions.map(
          (rolePermission) =>
            rolePermission.permission.name,
        ),
      ),
    );

    const result = permissions.map((permission) => {
      const hasOverride = overrideMap.has(
        permission.name,
      );

      const override = overrideMap.get(
        permission.name,
      );

      return {
        name: permission.name,
        description: permission.description,
        roleAllowed: rolePermissions.has(
          permission.name,
        ),
        override: hasOverride ? override : null,
        allowed: hasOverride
          ? override
          : rolePermissions.has(permission.name),
      };
    });

    return res.json({
      success: true,
      user,
      permissions: result,
    });
  } catch (error) {
    console.error(
      "Get user permissions error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user permissions",
    });
  }
};

export const updateUserPermissions = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const { permissions } = req.body as {
      permissions?: Array<{
        name: string;
        allowed: boolean;
      }>;
    };

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "permissions must be an array",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "SUPER_ADMIN") {
      return res.status(400).json({
        success: false,
        message:
          "SUPER_ADMIN permissions cannot be overridden",
      });
    }

    const permissionRecords =
      await prisma.permission.findMany({
        where: {
          name: {
            in: permissions.map(
              (permission) => permission.name,
            ),
          },
        },
      });

    const permissionMap = new Map(
      permissionRecords.map((permission) => [
        permission.name,
        permission,
      ]),
    );

    for (const item of permissions) {
      const permission = permissionMap.get(item.name);

      if (!permission) {
        return res.status(400).json({
          success: false,
          message: `Unknown permission: ${item.name}`,
        });
      }

      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId: id,
            permissionId: permission.id,
          },
        },
        update: {
          allowed: item.allowed,
        },
        create: {
          userId: id,
          permissionId: permission.id,
          allowed: item.allowed,
        },
      });
    }

    if (req.user?.userId) {
      await createAuditLog({
        actorUserId: req.user.userId,
        targetUserId: id,
        action: "USER_PERMISSIONS_UPDATED",
        metadata: {
          permissions,
        },
      });
    }

    return res.json({
      success: true,
      message: "User permissions updated successfully",
    });
  } catch (error) {
    console.error(
      "Update user permissions error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update user permissions",
    });
  }
};