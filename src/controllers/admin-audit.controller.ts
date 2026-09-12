import type { Request, Response } from "express";

import prisma from "../db/prisma";

export const getAuditLogs = async (
  req: Request,
  res: Response,
) => {
  try {
    /*
     * Pagination
     */
    const page = Math.max(
      Number(req.query.page) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 20,
        1,
      ),
      100,
    );

    const skip = (page - 1) * limit;

    /*
     * Filters
     */
    const action =
      typeof req.query.action === "string"
        ? req.query.action.trim()
        : undefined;

    const actorUserId =
      typeof req.query.actorUserId === "string"
        ? req.query.actorUserId.trim()
        : undefined;

    const targetUserId =
      typeof req.query.targetUserId === "string"
        ? req.query.targetUserId.trim()
        : undefined;

    /*
     * Build Prisma WHERE condition
     */
    const where = {
      ...(action && {
        action,
      }),
      ...(actorUserId && {
        actorUserId,
      }),
      ...(targetUserId && {
        targetUserId,
      }),
    };

    /*
     * Fetch logs + total
     */
    const [logs, total] =
      await prisma.$transaction([
        prisma.auditLog.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
          include: {
            actor: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
                profileImageUrl: true,
              },
            },
          },
        }),

        prisma.auditLog.count({
          where,
        }),
      ]);

    /*
     * Restore deleted-user information
     *
     * When a user is permanently deleted,
     * actor becomes null because the User record
     * no longer exists.
     *
     * USER_DELETED metadata contains the original
     * user's name, email and role.
     */
    const normalizedLogs = logs.map((log) => {
      if (
        log.action === "USER_DELETED" &&
        !log.actor
      ) {
        const metadata =
          log.metadata &&
          typeof log.metadata === "object"
            ? (log.metadata as Record<
                string,
                unknown
              >)
            : {};

        return {
          ...log,

          actor: {
            id:
              typeof metadata.deletedUserId ===
              "string"
                ? metadata.deletedUserId
                : log.targetUserId ??
                  log.actorUserId ??
                  "deleted-user",

            name:
              typeof metadata.name === "string"
                ? metadata.name
                : null,

            email:
              typeof metadata.email === "string"
                ? metadata.email
                : null,

            role:
              typeof metadata.role === "string"
                ? metadata.role
                : "USER",

            profileImageUrl: null,
          },
        };
      }

      return log;
    });

    const totalPages =
      Math.ceil(total / limit);

    /*
     * Stats
     */
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayLogs =
      await prisma.auditLog.count({
        where: {
          ...where,
          createdAt: {
            gte: todayStart,
          },
        },
      });

    const adminActions =
      await prisma.auditLog.count({
        where: {
          ...where,
          actorUserId: {
            not: null,
          },
          targetUserId: {
            not: null,
          },
        },
      });

    /*
     * Return response
     */
    return res.status(200).json({
      success: true,

      data: {
        logs: normalizedLogs,

        stats: {
          total,
          today: todayLogs,
          adminActions,
          failed: 0,
        },

        filters: {
          actions: [],
          resources: [],
          admins: [],
        },

        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage:
            page < totalPages,
          hasPreviousPage:
            page > 1,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get audit logs error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};
