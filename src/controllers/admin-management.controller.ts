import { Request, Response } from "express";

import bcrypt from "bcryptjs";

import prisma from "../db/prisma";
import { createAuditLog } from "../services/audit.service";

const ALLOWED_ROLES = [
  "EDITOR",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

type AdminRole = (typeof ALLOWED_ROLES)[number];

const isValidAdminRole = (
  role: unknown,
): role is AdminRole => {
  return (
    typeof role === "string" &&
    ALLOWED_ROLES.includes(role as AdminRole)
  );
};

export const getAdmins = async (
  _req: Request,
  res: Response,
) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: {
                in: ["ADMIN", "SUPER_ADMIN", "EDITOR"],
              },
            },
          },
        },
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error("Get admins error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch admins",
    });
  }
};

export const createAdmin = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user || typeof req.user === "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const actorUserId = req.user.userId;

    const {
      name,
      email,
      password,
      role = "ADMIN",
    } = req.body ?? {};

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long",
      });
    }

    if (!isValidAdminRole(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin role",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12,
    );

    const dbRole = await prisma.role.findUnique({
      where: {
        name: role,
      },
    });

    if (!dbRole) {
      return res.status(500).json({
        success: false,
        message:
          "Role not found. Run the RBAC seed first.",
      });
    }

    const user = await prisma.user.create({
      data: {
        name:
          typeof name === "string"
            ? name.trim()
            : null,

        email: normalizedEmail,

        passwordHash,

        role,

        userRoles: {
          create: {
            roleId: dbRole.id,
          },
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await createAuditLog({
      actorUserId,
      targetUserId: user.id,
      action: "ADMIN_CREATED",
      metadata: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: user,
    });
  } catch (error) {
    console.error("Create admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create admin",
    });
  }
};

export const updateAdmin = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user || typeof req.user === "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const actorUserId = req.user.userId;

    const { id } = req.params;

    const {
      name,
      email,
      role,
    } = req.body ?? {};

    const existingUser =
      await prisma.user.findUnique({
        where: { id },
      });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (
      !isValidAdminRole(existingUser.role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Target user does not have a valid admin role",
      });
    }

    if (
      role !== undefined &&
      !isValidAdminRole(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin role",
      });
    }

    /*
     * Prevent SUPER_ADMIN from demoting itself.
     */
    if (
      id === actorUserId &&
      existingUser.role === "SUPER_ADMIN" &&
      role !== undefined &&
      role !== "SUPER_ADMIN"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "SUPER_ADMIN cannot demote itself",
      });
    }

    /*
     * Prevent changing the last active SUPER_ADMIN
     * to another role.
     */
    if (
      existingUser.role === "SUPER_ADMIN" &&
      role !== undefined &&
      role !== "SUPER_ADMIN"
    ) {
      const superAdminCount =
        await prisma.user.count({
          where: {
            role: "SUPER_ADMIN",
            isDisabled: false,
          },
        });

      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot demote the last SUPER_ADMIN",
        });
      }
    }

    /*
     * Check duplicate email.
     */
    let normalizedEmail: string | undefined;

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      normalizedEmail = email
        .trim()
        .toLowerCase();

      const emailOwner =
        await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

      if (
        emailOwner &&
        emailOwner.id !== id
      ) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    let roleId: string | undefined;

    if (role !== undefined) {
      const dbRole =
        await prisma.role.findUnique({
          where: {
            name: role,
          },
        });

      if (!dbRole) {
        return res.status(500).json({
          success: false,
          message: "Role not found",
        });
      }

      roleId = dbRole.id;
    }

    const oldAdmin = {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      isDisabled: existingUser.isDisabled,
    };

    const updatedAdmin =
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id },

          data: {
            ...(name !== undefined && {
              name:
                typeof name === "string"
                  ? name.trim()
                  : null,
            }),

            ...(normalizedEmail !== undefined && {
              email: normalizedEmail,
            }),

            ...(role !== undefined && {
              role,
            }),
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isDisabled: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        /*
         * Keep UserRole synchronized with User.role.
         */
        if (roleId) {
          await tx.userRole.deleteMany({
            where: {
              userId: id,
            },
          });

          await tx.userRole.create({
            data: {
              userId: id,
              roleId,
            },
          });
        }

        return user;
      });

    /*
     * Record general admin update.
     */
    await createAuditLog({
      actorUserId,
      targetUserId: id,
      action: "ADMIN_UPDATED",
      metadata: {
        oldAdmin,
        newAdmin: {
          name: updatedAdmin.name,
          email: updatedAdmin.email,
          role: updatedAdmin.role,
          isDisabled: updatedAdmin.isDisabled,
        },
      },
    });

    /*
     * Record role change separately.
     */
    if (
      role !== undefined &&
      oldAdmin.role !== updatedAdmin.role
    ) {
      await createAuditLog({
        actorUserId,
        targetUserId: id,
        action: "ROLE_CHANGED",
        metadata: {
          oldRole: oldAdmin.role,
          newRole: updatedAdmin.role,
          source: "ADMIN_MANAGEMENT",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updatedAdmin,
    });
  } catch (error) {
    console.error("Update admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update admin",
    });
  }
};

export const deleteAdmin = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user || typeof req.user === "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const actorUserId = req.user.userId;

    const { id } = req.params;

    const existingUser =
      await prisma.user.findUnique({
        where: { id },
      });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    /*
     * Prevent deleting yourself.
     */
    if (id === actorUserId) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot delete itself",
      });
    }

    /*
     * Prevent deleting the last active SUPER_ADMIN.
     */
    if (existingUser.role === "SUPER_ADMIN") {
      const superAdminCount =
        await prisma.user.count({
          where: {
            role: "SUPER_ADMIN",
            isDisabled: false,
          },
        });

      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete the last SUPER_ADMIN",
        });
      }
    }

    const deletedAdmin = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role,
      isDisabled: existingUser.isDisabled,
    };

    /*
     * Audit first, then delete.
     *
     * Both operations are inside the same transaction.
     */
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorUserId,
          targetUserId: existingUser.id,
          action: "ADMIN_DELETED",
          metadata: {
            email: deletedAdmin.email,
            name: deletedAdmin.name,
            role: deletedAdmin.role,
            isDisabled: deletedAdmin.isDisabled,
          },
        },
      });

      await tx.user.delete({
        where: { id },
      });
    });

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete admin",
    });
  }
};
