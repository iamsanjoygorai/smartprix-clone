import { Request, Response } from "express";

import prisma from "../../db/prisma";

// ============================================================
// DELETE MY ACCOUNT
// ============================================================

export const deleteMyAccount = async (
  req: Request,
  res: Response,
) => {
  // KEEP YOUR EXISTING deleteMyAccount CODE HERE
};


// ============================================================
// GET MY SESSIONS
// ============================================================

export const getMySessions = async (
  req: Request,
  res: Response,
) => {
  try {
    if (
      !req.user ||
      typeof req.user === "string"
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user.userId;

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
          deviceType: true,
          browser: true,
          operatingSystem: true,
          ipAddress: true,
          userAgent: true,
          startedAt: true,
          lastSeenAt: true,
          endedAt: true,
          isActive: true,
        },
      });

    return res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error(
      "Get my sessions failed:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load sessions",
    });
  }
};