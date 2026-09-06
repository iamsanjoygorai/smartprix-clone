import { Request, Response, NextFunction } from "express";

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only SUPER_ADMIN can manage permissions",
    });
  }

  next();
};