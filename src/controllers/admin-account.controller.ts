import { Request, Response } from "express";
import { changeAdminPassword } from "../services/admin-account.service";

export const changePassword = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });
    }

    if (!currentPassword.trim()) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }

    if (!newPassword.trim()) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long",
      });
    }

    await changeAdminPassword({
      userId,
      currentPassword,
      newPassword,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to change password";

    if (
      message === "Current password is incorrect"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (
      message ===
      "New password must be different from your current password"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (message === "User not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};
