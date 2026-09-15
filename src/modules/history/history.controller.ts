import { Request, Response } from "express";

import historyService from "./history.service";

/* =========================================================
   HELPERS
========================================================= */

const getStringParam = (
  value: unknown,
): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
};

const getNumberParam = (
  value: unknown,
  fallback: number,
): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
};

/* =========================================================
   GET TIMELINE
   GET /api/admin/history
========================================================= */

export const getHistoryTimeline = async (
  req: Request,
  res: Response,
) => {
  try {
    const page = Math.max(
      1,
      getNumberParam(req.query.page, 1),
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        getNumberParam(
          req.query.limit,
          25,
        ),
      ),
    );

    const operation =
      getStringParam(
        req.query.operation,
      );

    const search =
      getStringParam(
        req.query.search,
      );

    const entityType =
      getStringParam(
        req.query.entityType,
      );

    const entityId =
      getStringParam(
        req.query.entityId,
      );

    const actorUserId =
      getStringParam(
        req.query.actorUserId,
      );

    const targetUserId =
      getStringParam(
        req.query.targetUserId,
      );

    const category =
      getStringParam(
        req.query.category,
      );

    const eventType =
      getStringParam(
        req.query.eventType,
      );

    const fromValue =
      getStringParam(
        req.query.from,
      );

    const toValue =
      getStringParam(
        req.query.to,
      );

    const from = fromValue
      ? new Date(fromValue)
      : undefined;

    const to = toValue
      ? new Date(toValue)
      : undefined;

    if (
      from &&
      Number.isNaN(from.getTime())
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid 'from' date.",
      });

      return;
    }

    if (
      to &&
      Number.isNaN(to.getTime())
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid 'to' date.",
      });

      return;
    }

    const result =
      await historyService.getTimeline({
        entityType,
        entityId,
        actorUserId,
        targetUserId,
        category,
        eventType,
        operation,
        search,
        from,
        to,
        page,
        limit,
      });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to fetch history timeline:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch history.",
    });
  }
};

/* =========================================================
   GET ENTITY TIMELINE
   GET /api/admin/history/entity/:entityType/:entityId
========================================================= */

export const getEntityHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const entityType =
      getStringParam(
        req.params.entityType,
      );

    const entityId =
      getStringParam(
        req.params.entityId,
      );

    if (!entityType || !entityId) {
      res.status(400).json({
        success: false,
        message:
          "entityType and entityId are required.",
      });

      return;
    }

    const page = Math.max(
      1,
      getNumberParam(
        req.query.page,
        1,
      ),
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        getNumberParam(
          req.query.limit,
          25,
        ),
      ),
    );

    const result =
      await historyService.getEntityTimeline(
        entityType,
        entityId,
        {
          page,
          limit,
          category:
            getStringParam(
              req.query.category,
            ),
          eventType:
            getStringParam(
              req.query.eventType,
            ),
          operation:
            getStringParam(
              req.query.operation,
            ),
        },
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to fetch entity history:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch entity history.",
    });
  }
};

/* =========================================================
   GET EVENT
   GET /api/admin/history/event/:eventId
========================================================= */

export const getHistoryEvent = async (
  req: Request,
  res: Response,
) => {
  try {
    const eventId =
      getStringParam(
        req.params.eventId,
      );

    if (!eventId) {
      res.status(400).json({
        success: false,
        message:
          "eventId is required.",
      });

      return;
    }

    const event =
      await historyService.getEvent(
        eventId,
      );

    if (!event) {
      res.status(404).json({
        success: false,
        message:
          "History event not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error(
      "Failed to fetch history event:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch history event.",
    });
  }
};

/* =========================================================
   GET VERSION
   GET /api/admin/history/version/:entityType/:entityId/:version
========================================================= */

export const getHistoryVersion = async (
  req: Request,
  res: Response,
) => {
  try {
    const entityType =
      getStringParam(
        req.params.entityType,
      );

    const entityId =
      getStringParam(
        req.params.entityId,
      );

    const version =
      getNumberParam(
        req.params.version,
        0,
      );

    if (
      !entityType ||
      !entityId ||
      version < 1
    ) {
      res.status(400).json({
        success: false,
        message:
          "Valid entityType, entityId and version are required.",
      });

      return;
    }

    const result =
      await historyService.getVersion(
        entityType,
        entityId,
        version,
      );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      "Failed to fetch history version:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch history version.",
    });
  }
};

/* =========================================================
   GET LATEST VERSION
   GET /api/admin/history/latest/:entityType/:entityId
========================================================= */

export const getLatestHistoryVersion =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const entityType =
        getStringParam(
          req.params.entityType,
        );

      const entityId =
        getStringParam(
          req.params.entityId,
        );

      if (
        !entityType ||
        !entityId
      ) {
        res.status(400).json({
          success: false,
          message:
            "entityType and entityId are required.",
        });

        return;
      }

      const version =
        await historyService.getLatestVersion(
          entityType,
          entityId,
        );

      res.status(200).json({
        success: true,
        data: {
          entityType,
          entityId,
          version,
        },
      });
    } catch (error) {
      console.error(
        "Failed to fetch latest history version:",
        error,
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch latest history version.",
      });
    }
  };

/* =========================================================
   GET DIFF
   GET /api/admin/history/diff/:entityType/:entityId
========================================================= */

export const getHistoryDiff = async (
  req: Request,
  res: Response,
) => {
  try {
    const entityType =
      getStringParam(
        req.params.entityType,
      );

    const entityId =
      getStringParam(
        req.params.entityId,
      );

    const fromVersion =
      getNumberParam(
        req.query.fromVersion,
        0,
      );

    const toVersion =
      getNumberParam(
        req.query.toVersion,
        0,
      );

    if (
      !entityType ||
      !entityId ||
      fromVersion < 1 ||
      toVersion < 1
    ) {
      res.status(400).json({
        success: false,
        message:
          "entityType, entityId, fromVersion and toVersion are required.",
      });

      return;
    }

    const changes =
      await historyService.getDiff(
        entityType,
        entityId,
        fromVersion,
        toVersion,
      );

    res.status(200).json({
      success: true,
      data: {
        entityType,
        entityId,
        fromVersion,
        toVersion,
        changes,
      },
    });
  } catch (error) {
    console.error(
      "Failed to compare history versions:",
      error,
    );

    res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to compare history versions.",
    });
  }
};