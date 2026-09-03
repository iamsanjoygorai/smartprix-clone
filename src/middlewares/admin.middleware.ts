import { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "jsonwebtoken";

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  if (!user || typeof user === "string") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }

  const payload = user as JwtPayload & {
    userId?: string;
    role?: string;
  };

  if (payload.role !== "ADMIN") {
    res.status(403).json({
      success: false,
      message: "Admin access required",
    });
    return;
  }

  next();
};