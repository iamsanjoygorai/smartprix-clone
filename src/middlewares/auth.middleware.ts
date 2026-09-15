import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

import { env } from "../config/env";

import prisma from "../db/prisma";

import type { JwtPayload } from "../config/jwt";

const AUTH_COOKIE_NAME = "smartprix_auth";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    /* =====================================================
       GET TOKEN

       Priority:
       1. HttpOnly authentication cookie
       2. Authorization Bearer token (temporary fallback)
    ===================================================== */

    const cookieToken =
      req.cookies?.[AUTH_COOKIE_NAME];

    const authorization =
      req.headers.authorization;

    const bearerToken =
      authorization &&
      authorization.startsWith("Bearer ")
        ? authorization.split(" ")[1]
        : null;

    const token =
      typeof cookieToken === "string" &&
      cookieToken.trim()
        ? cookieToken
        : bearerToken;

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

    const decoded = jwt.verify(
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
        message: "Invalid authentication token",
      });
      return;
    }

    const payload = decoded as JwtPayload;

    if (!payload.userId) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
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

       New JWTs contain sessionId.

       The session must:
       - belong to this user
       - still be active
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
         UPDATE LAST ACTIVITY
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
       * Always use the current database role.
       * Never trust a stale JWT role.
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
      message: "Invalid or expired token",
    });
  }
};