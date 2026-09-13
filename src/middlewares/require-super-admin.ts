import {
  Request,
  Response,
  NextFunction,
} from "express";

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user;

  if (!user?.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message:
        "Only SUPER_ADMIN can access this resource",
    });
  }

  return next();
};