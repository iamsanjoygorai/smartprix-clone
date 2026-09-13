import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { env } from "../config/env";

import prisma from "../db/prisma";

import type { JwtPayload } from "../config/jwt";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    /* =====================================================
       AUTHORIZATION HEADER
    ===================================================== */

    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const token =
      authorization.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    /* =====================================================
       VERIFY TOKEN
    ===================================================== */

    const decoded =
      jwt.verify(
        token,
        env.JWT_SECRET,
      );

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded)
    ) {
      res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });

      return;
    }

    const payload =
      decoded as JwtPayload;

    if (!payload.userId) {
      res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });

      return;
    }

    /* =====================================================
       FIND USER
    ===================================================== */

    const user =
      await prisma.user.findUnique({
        where: {
          id: payload.userId,
        },

        select: {
          id: true,
          role: true,
          isDisabled: true,
          isDeleted: true,
        },
      });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    /* =====================================================
       DELETED ACCOUNT
    ===================================================== */

    if (user.isDeleted) {
      res.status(403).json({
        success: false,
        message:
          "This account has been permanently deleted",
      });

      return;
    }

    /* =====================================================
       DISABLED ACCOUNT
    ===================================================== */

    if (user.isDisabled) {
      res.status(401).json({
        success: false,
        message: "Account is disabled",
      });

      return;
    }

    /* =====================================================
       SESSION VALIDATION
       
       Old JWTs may not contain sessionId.
       They remain valid.
       
       New JWTs contain sessionId and must belong
       to this user and be active.
    ===================================================== */

    if (payload.sessionId) {
      const session =
        await prisma.userSession.findFirst({
          where: {
            id: payload.sessionId,
            userId: user.id,
            isActive: true,
          },

          select: {
            id: true,
          },
        });

      if (!session) {
        res.status(401).json({
          success: false,
          message:
            "Session expired or logged out",
        });

        return;
      }

      /* ---------------------------------------------------
         Update last activity
      --------------------------------------------------- */

      await prisma.userSession.update({
        where: {
          id: session.id,
        },

        data: {
          lastSeenAt: new Date(),
        },
      });
    }

    /* =====================================================
       ATTACH AUTH USER
    ===================================================== */

    req.user = {
      ...payload,

      /*
       * Use the current database role.
       * This prevents a stale JWT role from being trusted.
       */
      role: user.role,
    };

    next();
  } catch (error) {
    console.error(
      "Authentication failed:",
      error,
    );

    res.status(401).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
};