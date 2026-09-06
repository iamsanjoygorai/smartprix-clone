import type { Request, Response } from "express";
import bcrypt from "bcryptjs";

import prisma from "../db/prisma";
import { createAuditLog } from "../services/audit.service";

const ALLOWED_ROLES = [
  "USER",
  "EDITOR",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

/**
 * GET /api/admin/users
 */
export const getUsers = async (
  _req: Request,
  res: Response,
) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isDisabled: true,
        createdAt: true,
        updatedAt: true,

        userRoles: {
          select: {
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/**
 * PATCH /api/admin/users/:id
 */
export const updateUser = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      password,
      role,
    } = req.body ?? {};

    if (!req.user || typeof req.user === "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const actorUserId = req.user.userId;

    const existingUser = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate role
    if (
      role !== undefined &&
      !ALLOWED_ROLES.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    // Prevent SUPER_ADMIN from demoting itself
    if (
      existingUser.id === actorUserId &&
      existingUser.role === "SUPER_ADMIN" &&
      role !== undefined &&
      role !== "SUPER_ADMIN"
    ) {
      return res.status(400).json({
        success: false,
        message: "SUPER_ADMIN cannot demote itself",
      });
    }

    // Prevent demoting the last active SUPER_ADMIN
    if (
      existingUser.role === "SUPER_ADMIN" &&
      role !== undefined &&
      role !== "SUPER_ADMIN"
    ) {
      const superAdminCount = await prisma.user.count({
        where: {
          role: "SUPER_ADMIN",
          isDisabled: false,
        },
      });

      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot demote the last SUPER_ADMIN",
        });
      }
    }

    // Validate email uniqueness
    if (
      email !== undefined &&
      email !== existingUser.email
    ) {
      const emailExists = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    // Validate password
    if (
      password !== undefined &&
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const passwordHash =
      password !== undefined
        ? await bcrypt.hash(password, 12)
        : undefined;

    const roleChanged =
      role !== undefined &&
      role !== existingUser.role;

    const updatedUser = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.update({
          where: {
            id,
          },
          data: {
            ...(name !== undefined && {
              name,
            }),

            ...(email !== undefined && {
              email,
            }),

            ...(passwordHash !== undefined && {
              passwordHash,
            }),

            ...(role !== undefined && {
              role,
            }),
          },

          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isDisabled: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Keep UserRole synchronized with User.role
        if (role !== undefined) {
          const dbRole = await tx.role.findUnique({
            where: {
              name: role,
            },
          });

          if (!dbRole) {
            throw new Error(
              `Role ${role} not found`,
            );
          }

          await tx.userRole.deleteMany({
            where: {
              userId: id,
            },
          });

          await tx.userRole.create({
            data: {
              userId: id,
              roleId: dbRole.id,
            },
          });
        }

        return user;
      },
    );

    // General user update audit
    await createAuditLog({
      actorUserId,
      targetUserId: existingUser.id,
      action: "USER_UPDATED",
      metadata: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        passwordChanged:
          password !== undefined,
      },
    });

    // Separate role-change audit
    if (roleChanged) {
      await createAuditLog({
        actorUserId,
        targetUserId: existingUser.id,
        action: "ROLE_CHANGED",
        metadata: {
          email: updatedUser.email,
          oldRole: existingUser.role,
          newRole: updatedUser.role,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

/**
 * PATCH /api/admin/users/:id/disable
 */
export const disableUser = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!req.user || typeof req.user === "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const actorUserId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isDisabled) {
      return res.status(400).json({
        success: false,
        message: "User is already disabled",
      });
    }

    // Prevent SUPER_ADMIN from disabling itself
    if (
      user.id === actorUserId &&
      user.role === "SUPER_ADMIN"
    ) {
      return res.status(400).json({
        success: false,
        message: "SUPER_ADMIN cannot disable itself",
      });
    }

    // Protect the last SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: {
          role: "SUPER_ADMIN",
          isDisabled: false,
        },
      });

      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot disable the last SUPER_ADMIN",
        });
      }
    }

    await prisma.user.update({
      where: {
        id,
      },
      data: {
        isDisabled: true,
      },
    });

    await createAuditLog({
      actorUserId,
      targetUserId: user.id,
      action: "USER_DISABLED",
      metadata: {
        email: user.email,
        role: user.role,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User disabled successfully",
    });
  } catch (error) {
    console.error("Disable user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to disable user",
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!req.user || typeof req.user === "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const actorUserId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent SUPER_ADMIN from deleting itself
    if (
      user.id === actorUserId &&
      user.role === "SUPER_ADMIN"
    ) {
      return res.status(400).json({
        success: false,
        message: "SUPER_ADMIN cannot delete itself",
      });
    }

    // Protect the last active SUPER_ADMIN
    if (user.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: {
          role: "SUPER_ADMIN",
          isDisabled: false,
        },
      });

      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last SUPER_ADMIN",
        });
      }
    }

    // Store values before deletion
    const deletedUserEmail = user.email;
    const deletedUserRole = user.role;

    await prisma.$transaction(async (tx) => {
      // Create audit log BEFORE deleting the user
      await tx.auditLog.create({
        data: {
          actorUserId,
          targetUserId: user.id,
          action: "USER_DELETED",
          metadata: {
            email: deletedUserEmail,
            role: deletedUserRole,
          },
        },
      });

      // Delete the user
      await tx.user.delete({
        where: {
          id,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};