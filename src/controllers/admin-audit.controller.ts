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
     * Fetch logs + total count together
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
              },
            },
          },
        }),

        prisma.auditLog.count({
          where,
        }),
      ]);

    const totalPages =
      Math.ceil(total / limit);

    return res.status(200).json({
      success: true,

      data: logs,

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
