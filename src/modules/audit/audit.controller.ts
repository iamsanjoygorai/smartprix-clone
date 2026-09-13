import type { Request, Response } from "express";
import prisma from "../../db/prisma";

import {
  createAuditLogWithContext,
} from "./audit.service";

import {
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
} from "./audit.constants";

/* =========================================================
   HELPERS
========================================================= */

function getParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getCurrentUserId(req: Request): string | null {
  const user = (req as any).user;

  if (!user) {
    return null;
  }

  if (typeof user === "string") {
    return user;
  }

  return user.userId ?? user.id ?? null;
}

/* =========================================================
   GET ALL AUDIT LOGS

   GET /api/admin/audit
========================================================= */

export const getAuditLogs = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      userId,
      action,
      category,
      ipAddress,
      sessionId,
      entityType,
      entityId,
      from,
      to,
      page = "1",
      limit = "50",
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1,
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 50, 1),
      100,
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const where: any = {};

    /* -----------------------------------------------------
       USER FILTER
    ----------------------------------------------------- */

    if (userId) {
      const id = String(userId);

      where.OR = [
        {
          actorUserId: id,
        },
        {
          targetUserId: id,
        },
      ];
    }

    /* -----------------------------------------------------
       BASIC FILTERS
    ----------------------------------------------------- */

    if (action) {
      where.action = String(action);
    }

    if (category) {
      where.category = String(category);
    }

    if (ipAddress) {
      where.ipAddress = {
        contains: String(ipAddress),
        mode: "insensitive",
      };
    }

    if (sessionId) {
      where.sessionId = String(sessionId);
    }

    if (entityType) {
      where.entityType = String(entityType);
    }

    if (entityId) {
      where.entityId = String(entityId);
    }

    /* -----------------------------------------------------
       DATE FILTER
    ----------------------------------------------------- */

    if (from || to) {
      where.createdAt = {};

      if (from) {
        const startDate = new Date(
          String(from),
        );

        if (!Number.isNaN(startDate.getTime())) {
          where.createdAt.gte = startDate;
        }
      }

      if (to) {
        const endDate = new Date(
          String(to),
        );

        if (!Number.isNaN(endDate.getTime())) {
          endDate.setHours(
            23,
            59,
            59,
            999,
          );

          where.createdAt.lte = endDate;
        }
      }
    }

    /* -----------------------------------------------------
       QUERY
    ----------------------------------------------------- */

    const [logs, total] =
      await prisma.$transaction([
        prisma.auditLog.findMany({
          where,

          orderBy: {
            createdAt: "desc",
          },

          skip,
          take: limitNumber,

          include: {
            actor: {
              select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                isDeleted: true,
              },
            },

            session: {
              select: {
                id: true,
                startedAt: true,
                lastSeenAt: true,
                endedAt: true,
                isActive: true,
                deviceType: true,
                browser: true,
                operatingSystem: true,
                ipAddress: true,
                country: true,
                state: true,
                city: true,
                timezone: true,
              },
            },
          },
        }),

        prisma.auditLog.count({
          where,
        }),
      ]);

    return res.status(200).json({
      success: true,

      data: logs,

      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(
          total / limitNumber,
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET AUDIT LOGS ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs.",
    });
  }
};

/* =========================================================
   GET USER AUDIT HISTORY

   GET /api/admin/audit/:userId
========================================================= */

export const getUserAuditHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = getParam(
      req.params.userId,
    );

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const logs =
      await prisma.auditLog.findMany({
        where: {
          OR: [
            {
              actorUserId: userId,
            },
            {
              targetUserId: userId,
            },
          ],
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
              role: true,
            },
          },

          session: {
            select: {
              id: true,
              startedAt: true,
              lastSeenAt: true,
              endedAt: true,
              isActive: true,
              deviceType: true,
              browser: true,
              operatingSystem: true,
              ipAddress: true,
              country: true,
              state: true,
              city: true,
              timezone: true,
            },
          },
        },
      });

    /* -----------------------------------------------------
       AUDIT THE AUDIT VIEW
    ----------------------------------------------------- */

    await createAuditLogWithContext(
      {
        action:
          AUDIT_ACTIONS.AUDIT_HISTORY_VIEWED,

        category:
          AUDIT_CATEGORIES.SECURITY,

        entityType: "User",

        entityId: userId,

        targetUserId: userId,

        description:
          "User audit history viewed by Super Admin",
      },

      {
        userId: getCurrentUserId(req),
      },
    );

    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error(
      "GET USER AUDIT HISTORY ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch user audit history.",
    });
  }
};

/* =========================================================
   GET USER SESSIONS

   GET /api/admin/audit/sessions/:userId
========================================================= */

export const getUserSessions = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = getParam(
      req.params.userId,
    );

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const sessions =
      await prisma.userSession.findMany({
        where: {
          userId,
        },

        orderBy: {
          startedAt: "desc",
        },

        select: {
          id: true,
          startedAt: true,
          lastSeenAt: true,
          endedAt: true,
          isActive: true,

          deviceType: true,
          browser: true,
          operatingSystem: true,

          ipAddress: true,
          userAgent: true,

          country: true,
          state: true,
          city: true,
          timezone: true,

          createdAt: true,
          updatedAt: true,
        },
      });

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error(
      "GET USER SESSIONS ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user sessions.",
    });
  }
};


/* =========================================================
   GET ALL USER SESSIONS
   GET /api/admin/audit/sessions
========================================================= */

export const getAllSessions = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      page = "1",
      limit = "50",
      search,
      status,
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1,
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 50, 1),
      100,
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const where: any = {};

    /* -----------------------------------------------------
       SESSION STATUS FILTER
    ----------------------------------------------------- */

    if (status === "active") {
      where.isActive = true;
    }

    if (status === "ended") {
      where.isActive = false;
    }

    /* -----------------------------------------------------
       USER SEARCH
    ----------------------------------------------------- */

    if (search) {
      const searchValue = String(search).trim();

      if (searchValue) {
        where.user = {
          OR: [
            {
              name: {
                contains: searchValue,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: searchValue,
                mode: "insensitive",
              },
            },
            {
              mobile: {
                contains: searchValue,
                mode: "insensitive",
              },
            },
          ],
        };
      }
    }

    /* -----------------------------------------------------
       QUERY + GLOBAL STATISTICS
    ----------------------------------------------------- */

    const [
  sessions,
  total,
  activeSessions,
  endedSessions,
  globalTotal,
  globalActive,
  globalEnded,
] = await prisma.$transaction([
  prisma.userSession.findMany({
    where,
    orderBy: {
      startedAt: "desc",
    },
    skip,
    take: limitNumber,
    select: {
      id: true,
      startedAt: true,
      lastSeenAt: true,
      endedAt: true,
      isActive: true,
      deviceType: true,
      browser: true,
      operatingSystem: true,
      ipAddress: true,
      userAgent: true,
      country: true,
      state: true,
      city: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          isDisabled: true,
          isDeleted: true,
          profileImageUrl: true,
        },
      },
    },
  }),

  prisma.userSession.count({
    where,
  }),

  prisma.userSession.count({
    where: {
      ...where,
      isActive: true,
    },
  }),

  prisma.userSession.count({
    where: {
      ...where,
      isActive: false,
    },
  }),

  prisma.userSession.count(),

  prisma.userSession.count({
    where: {
      isActive: true,
    },
  }),

  prisma.userSession.count({
    where: {
      isActive: false,
    },
  }),
]);

    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    return res.status(200).json({
  success: true,
  data: sessions,

  statistics: {
    total: globalTotal,
    active: globalActive,
    ended: globalEnded,
  },

  filteredStatistics: {
    total,
    active: activeSessions,
    ended: endedSessions,
  },

  pagination: {
    page: pageNumber,
    limit: limitNumber,
    total,
    totalPages: Math.ceil(
      total / limitNumber,
    ),
  },
});
  } catch (error) {
    console.error(
      "GET ALL SESSIONS ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sessions.",
    });
  }
};


/* =========================================================
   GET USER SEARCH HISTORY

   GET /api/admin/audit/search/:userId
========================================================= */

export const getUserSearchHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = getParam(
      req.params.userId,
    );

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const history =
      await prisma.searchHistory.findMany({
        where: {
          userId,
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          id: true,
          query: true,
          normalized: true,
          filters: true,

          ipAddress: true,
          userAgent: true,

          country: true,
          state: true,
          city: true,
          timezone: true,

          sessionId: true,
          createdAt: true,
        },
      });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error(
      "GET USER SEARCH HISTORY ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch user search history.",
    });
  }
};

export const getAllSearchHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      page = "1",
      limit = "50",
      search,
    } = req.query;

    const pageNumber = Math.max(
      Number(page) || 1,
      1,
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 50, 1),
      100,
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const where: any = {};

    if (search) {
      const searchValue = String(search).trim();

      if (searchValue) {
        where.OR = [
          {
            query: {
              contains: searchValue,
              mode: "insensitive",
            },
          },
          {
            normalized: {
              contains: searchValue,
              mode: "insensitive",
            },
          },
          {
            user: {
              name: {
                contains: searchValue,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              email: {
                contains: searchValue,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              mobile: {
                contains: searchValue,
                mode: "insensitive",
              },
            },
          },
        ];
      }
    }

    const [history, total] =
      await prisma.$transaction([
        prisma.searchHistory.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limitNumber,

          select: {
            id: true,
            query: true,
            normalized: true,
            filters: true,

            ipAddress: true,
            userAgent: true,
            country: true,
            state: true,
            city: true,
            timezone: true,

            createdAt: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                isDisabled: true,
                isDeleted: true,
                profileImageUrl: true,
              },
            },

            session: {
              select: {
                id: true,
                startedAt: true,
                lastSeenAt: true,
                endedAt: true,
                isActive: true,
                deviceType: true,
                browser: true,
                operatingSystem: true,
              },
            },
          },
        }),

        prisma.searchHistory.count({
          where,
        }),
      ]);

    return res.status(200).json({
      success: true,
      data: history,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(
          total / limitNumber,
        ),
      },
    });
  } catch (error) {
    console.error(
      "GET ALL SEARCH HISTORY ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch search history.",
    });
  }
};