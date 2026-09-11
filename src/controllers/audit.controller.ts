import { Request, Response } from "express";
import * as XLSX from "xlsx";

import prisma from "../db/prisma";

/* =========================================================
   HELPERS
========================================================= */

const getStringQuery = (
  value: unknown,
): string => {
  return typeof value === "string"
    ? value.trim()
    : "";
};

const getDateRange = (
  value: string,
) => {
  const now = new Date();

  if (value === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
      gte: start,
      lte: end,
    };
  }

  if (value === "7days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);

    return {
      gte: start,
      lte: now,
    };
  }

  if (value === "30days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);

    return {
      gte: start,
      lte: now,
    };
  }

  return undefined;
};

/* =========================================================
   BUILD FILTER
========================================================= */

const buildAuditWhere = (
  req: Request,
) => {
  const action = getStringQuery(
    req.query.action,
  );

  const resource = getStringQuery(
    req.query.resource,
  );

  const adminId = getStringQuery(
    req.query.admin,
  );

  const search = getStringQuery(
    req.query.search,
  );

  const dateRange = getStringQuery(
    req.query.dateRange,
  );

  const where: any = {};

  /* -------------------------------------------------------
     ACTION
  ------------------------------------------------------- */

  if (action) {
    where.action = action;
  }

  /* -------------------------------------------------------
     ADMIN
  ------------------------------------------------------- */

  if (adminId) {
    where.actorUserId = adminId;
  }

  /* -------------------------------------------------------
     RESOURCE
  ------------------------------------------------------- */

  if (resource) {
    where.metadata = {
      path: ["resource"],
      equals: resource,
    };
  }

  /* -------------------------------------------------------
     DATE RANGE
  ------------------------------------------------------- */

  const createdAt =
    getDateRange(dateRange);

  if (createdAt) {
    where.createdAt = createdAt;
  }

  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

  if (search) {
    where.OR = [
      {
        action: {
          contains: search,
          mode: "insensitive",
        },
      },

      {
        actor: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      },

      {
        actor: {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  return where;
};

/* =========================================================
   GET AUDIT LOGS
========================================================= */

export const getAuditLogs = async (
  req: Request,
  res: Response,
) => {
  try {
    const page = Math.max(
      Number(req.query.page) || 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 25,
        1,
      ),
      100,
    );

    const skip =
      (page - 1) * limit;

    const where =
      buildAuditWhere(req);

    /* -------------------------------------------------------
       TODAY
    ------------------------------------------------------- */

    const todayStart =
      new Date();

    todayStart.setHours(
      0,
      0,
      0,
      0,
    );

    const tomorrowStart =
      new Date(todayStart);

    tomorrowStart.setDate(
      tomorrowStart.getDate() + 1,
    );

    /* -------------------------------------------------------
       STATS
    ------------------------------------------------------- */

    const [
      logs,
      total,
      today,
      adminActions,
      failed,
    ] = await Promise.all([
      prisma.auditLog.findMany({
        where,

        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profileImageUrl: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,
      }),

      /* Total */

      prisma.auditLog.count({
        where,
      }),

      /* Today */

      prisma.auditLog.count({
        where: {
          ...where,

          createdAt: {
            gte: todayStart,
            lt: tomorrowStart,
          },
        },
      }),

      /* Admin actions */

      prisma.auditLog.count({
        where: {
          ...where,
          actorUserId: {
            not: null,
          },
        },
      }),

      /* Failed actions */

      prisma.auditLog.count({
        where: {
          ...where,

          metadata: {
            path: ["status"],
            equals: "FAILED",
          },
        },
      }),
    ]);

    /* -------------------------------------------------------
       AVAILABLE ADMINS
    ------------------------------------------------------- */

    const admins =
      await prisma.user.findMany({
        where: {
          role: {
            in: [
              "ADMIN",
              "SUPER_ADMIN",
            ],
          },
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },

        orderBy: {
          name: "asc",
        },
      });

    /* -------------------------------------------------------
       ACTIONS
    ------------------------------------------------------- */

    const actionRows =
      await prisma.auditLog.findMany({
        select: {
          action: true,
        },

        distinct: ["action"],

        orderBy: {
          action: "asc",
        },
      });

    const actions =
      actionRows.map(
        (item) => item.action,
      );

    /* -------------------------------------------------------
       RESOURCES
    ------------------------------------------------------- */

    const resourceRows =
      await prisma.auditLog.findMany({
        select: {
          metadata: true,
        },

        take: 1000,
      });

    const resourceSet =
      new Set<string>();

    for (const row of resourceRows) {
      if (
        row.metadata &&
        typeof row.metadata === "object" &&
        "resource" in row.metadata
      ) {
        const resource =
          (
            row.metadata as Record<
              string,
              unknown
            >
          ).resource;

        if (
          typeof resource === "string" &&
          resource.trim()
        ) {
          resourceSet.add(
            resource.trim(),
          );
        }
      }
    }

    const resources =
      Array.from(resourceSet).sort();

    return res.json({
      success: true,

      data: {
        logs,

        stats: {
          total,
          today,
          adminActions,
          failed,
        },

        filters: {
          actions,
          resources,
          admins,
        },

        pagination: {
          page,
          limit,
          total,
          totalPages:
            Math.ceil(
              total / limit,
            ),
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
      message:
        "Failed to fetch audit logs",
    });
  }
};

/* =========================================================
   EXPORT AUDIT LOGS
========================================================= */

export const exportAuditLogs = async (
  req: Request,
  res: Response,
) => {
  try {
    const format =
      getStringQuery(
        req.query.format,
      ).toLowerCase() || "json";

    const where =
      buildAuditWhere(req);

    const logs =
      await prisma.auditLog.findMany({
        where,

        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    /* -------------------------------------------------------
       EXPORT ROWS
    ------------------------------------------------------- */

    const exportRows =
      logs.map((log) => {
        const metadata =
          log.metadata &&
          typeof log.metadata === "object"
            ? (log.metadata as Record<
                string,
                unknown
              >)
            : {};

        return {
          ID: log.id,

          Time:
            log.createdAt.toISOString(),

          Admin:
            log.actor?.name ||
            log.actor?.email ||
            "Unknown",

          AdminEmail:
            log.actor?.email || "",

          Role:
            log.actor?.role || "",

          Action:
            log.action,

          Resource:
            typeof metadata.resource ===
            "string"
              ? metadata.resource
              : "",

          Status:
            typeof metadata.status ===
            "string"
              ? metadata.status
              : "SUCCESS",

          TargetUser:
            log.targetUserId || "",

          Metadata:
            JSON.stringify(
              log.metadata ?? {},
            ),
        };
      });

    /* =====================================================
       JSON
    ===================================================== */

    if (format === "json") {
      res.setHeader(
        "Content-Type",
        "application/json",
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="smartprix-audit-logs-${Date.now()}.json"`,
      );

      return res.send(
        JSON.stringify(
          exportRows,
          null,
          2,
        ),
      );
    }

    /* =====================================================
       EXCEL
    ===================================================== */

    if (
      format === "xlsx" ||
      format === "excel"
    ) {
      const worksheet =
        XLSX.utils.json_to_sheet(
          exportRows,
        );

      worksheet["!cols"] = [
        { wch: 30 },
        { wch: 24 },
        { wch: 24 },
        { wch: 34 },
        { wch: 16 },
        { wch: 28 },
        { wch: 22 },
        { wch: 16 },
        { wch: 30 },
        { wch: 60 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Audit Logs",
      );

      const buffer =
        XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="smartprix-audit-logs-${Date.now()}.xlsx"`,
      );

      return res.send(buffer);
    }

    return res.status(400).json({
      success: false,
      message:
        "Invalid export format. Use xlsx or json.",
    });
  } catch (error) {
    console.error(
      "Export audit logs error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to export audit logs",
    });
  }
};