import { Request, Response } from "express";
import { deleteAccount } from "./account.service";

export const deleteMyAccount = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    await deleteAccount(userId);

    res.status(200).json({
      success: true,
      message:
        "Your account has been permanently deleted. Your historical records have been retained.",
    });
  } catch (error: any) {
    console.error("Delete account controller error:", error);

    res.status(error?.statusCode || 500).json({
      success: false,
      message: error?.message || "Failed to delete account",
    });
  }
};