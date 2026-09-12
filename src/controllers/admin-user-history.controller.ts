import { Request, Response } from "express";

import prisma from "../db/prisma";

/* =========================================================
   GET USER HISTORY
========================================================= */

export const getUserHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "User ID is required",
      });
      return;
    }

    /* =======================================================
       GET CURRENT USER
    ======================================================= */

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        isDisabled: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    /* =======================================================
       GET AUDIT HISTORY

       We search both actorUserId and targetUserId.

       targetUserId is especially important because the
       account may already have been permanently deleted.
    ======================================================= */

    const logs = await prisma.auditLog.findMany({
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
      select: {
        id: true,
        actorUserId: true,
        targetUserId: true,
        action: true,
        metadata: true,
        createdAt: true,

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
    });

    /* =======================================================
       DELETED USER FALLBACK

       After permanent deletion, the User record no longer
       exists. Recover the basic account information from
       USER_DELETED metadata.
    ======================================================= */

    let historyUser = user;

    if (!historyUser) {
      const deletionLog = logs.find(
        (log) => log.action === "USER_DELETED",
      );

      const metadata =
        deletionLog?.metadata &&
        typeof deletionLog.metadata === "object"
          ? (deletionLog.metadata as Record<
              string,
              unknown
            >)
          : null;

      if (deletionLog) {
        historyUser = {
          id: userId,

          name:
            typeof metadata?.name === "string"
              ? metadata.name
              : null,

          email:
            typeof metadata?.email === "string"
              ? metadata.email
              : null,

          mobile:
            typeof metadata?.mobile === "string"
              ? metadata.mobile
              : null,

          role:
            typeof metadata?.role === "string"
              ? metadata.role
              : "USER",

          isDisabled: false,

          profileImageUrl: null,

          createdAt: deletionLog.createdAt,

          updatedAt: deletionLog.createdAt,
        };
      }
    }

    /* =======================================================
       STATISTICS
    ======================================================= */

    const stats = {
      total: logs.length,

      registered: logs.filter(
        (log) =>
          log.action === "USER_REGISTERED",
      ).length,

      logins: logs.filter(
        (log) =>
          log.action === "USER_LOGIN",
      ).length,

      logouts: logs.filter(
        (log) =>
          log.action === "USER_LOGOUT",
      ).length,

      profileUpdates: logs.filter(
        (log) =>
          log.action === "PROFILE_UPDATED",
      ).length,

      profileImageUpdates: logs.filter(
        (log) =>
          log.action === "PROFILE_IMAGE_UPDATED",
      ).length,

      profileImageDeletes: logs.filter(
        (log) =>
          log.action === "PROFILE_IMAGE_DELETED",
      ).length,

      deleted: logs.filter(
        (log) =>
          log.action === "USER_DELETED",
      ).length,

      adminActions: logs.filter(
        (log) =>
          log.targetUserId === userId &&
          log.actorUserId !== userId,
      ).length,
    };

    /* =======================================================
       RESPONSE
    ======================================================= */

    res.status(200).json({
      success: true,

      data: {
        user: historyUser,

        logs,

        stats,
      },
    });
  } catch (error) {
    console.error(
      "Get user history failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to load user history",
    });
  }
};
