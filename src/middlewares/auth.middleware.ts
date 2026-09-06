import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

import { env } from "../config/env";
import prisma from "../db/prisma";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

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

    const userId = decoded.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        isDisabled: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.isDisabled) {
      res.status(401).json({
        success: false,
        message: "Account is disabled",
      });
      return;
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Authentication failed:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};