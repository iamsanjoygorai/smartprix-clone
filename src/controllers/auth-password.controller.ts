import { Request, Response } from "express";
import {
  requestPasswordReset,
  resetPassword,
} from "../services/auth-password.service";
import { env } from "../config/env";

export const forgotPassword = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    await requestPasswordReset(
      email,
      env.CLIENT_URL,
    );

    /*
     * Deliberately generic response.
     */
    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request",
    });
  }
};

export const resetUserPassword = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      token,
      newPassword,
    } = req.body;

    if (
      typeof token !== "string" ||
      !token.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
    }

    if (
      typeof newPassword !== "string" ||
      !newPassword
    ) {
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

    await resetPassword(
      token,
      newPassword,
    );

    return res.status(200).json({
      success: true,
      message:
        "Password has been reset successfully",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to reset password";

    if (
      message ===
        "Password reset link is invalid or expired" ||
      message ===
        "New password must be different from your current password"
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};