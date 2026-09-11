import { Request, Response } from "express";

import {
  findPasswordRecoveryAccount,
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resendPasswordResetCode,
  verifyPasswordForRecovery,
  resetPassword,
  NO_ACCOUNT_ERROR,
  INVALID_CODE_ERROR,
  EXPIRED_CODE_ERROR,
  TOO_MANY_ATTEMPTS_ERROR,
  RESEND_COOLDOWN_ERROR,
  RESET_SESSION_ERROR,
} from "../services/auth-password.service";

export const forgotPassword = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      identifier,
      email,
    } = req.body;

    const value =
      typeof identifier === "string"
        ? identifier
        : typeof email === "string"
          ? email
          : "";

    if (!value.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter your mobile number or email address.",
      });
    }

    const account =
      await findPasswordRecoveryAccount(
        value,
      );

    return res.status(200).json({
      success: true,
      message: "Account found",
      data: {
        userId: account.userId,
        maskedEmail: account.maskedEmail,
        maskedMobile: account.maskedMobile,
        recoveryMethods:
          account.recoveryMethods,
      },
    });
  } catch (error) {
    console.error(
      "Find password recovery account error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to find account";

    if (
      message === NO_ACCOUNT_ERROR
    ) {
      return res.status(404).json({
        success: false,
        message: NO_ACCOUNT_ERROR,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to find account",
    });
  }
};

export const sendVerificationCode = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      identifier,
    } = req.body;

    if (
      typeof identifier !== "string" ||
      !identifier.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number or email address is required",
      });
    }

    const result =
      await sendPasswordResetCode(
        identifier,
      );

    return res.status(200).json({
      success: true,
      message:
        "Verification code sent",
      data: result,
    });
  } catch (error) {
    console.error(
      "Send password reset code error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to send verification code";

    if (
      message === NO_ACCOUNT_ERROR
    ) {
      return res.status(404).json({
        success: false,
        message: NO_ACCOUNT_ERROR,
      });
    }

    if (
      message === RESEND_COOLDOWN_ERROR
    ) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    if (
  message ===
  "Unable to send verification SMS"
) {
  return res.status(502).json({
    success: false,
    message,
  });
}

    return res.status(500).json({
      success: false,
      message:
        "Unable to send verification code",
    });

    
  }
  
};

export const verifyCode = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      identifier,
      code,
    } = req.body;

    if (
      typeof identifier !== "string" ||
      !identifier.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number or email address is required",
      });
    }

    if (
      typeof code !== "string" ||
      !/^\d{6}$/.test(code.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter the 6-digit verification code",
      });
    }

    const result =
      await verifyPasswordResetCode(
        identifier,
        code,
      );

    return res.status(200).json({
      success: true,
      message:
        "Verification successful",
      data: result,
    });
  } catch (error) {
    console.error(
      "Verify password reset code error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify code";

    if (
      message === INVALID_CODE_ERROR ||
      message === EXPIRED_CODE_ERROR ||
      message === TOO_MANY_ATTEMPTS_ERROR
    ) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (
      message === NO_ACCOUNT_ERROR
    ) {
      return res.status(404).json({
        success: false,
        message: NO_ACCOUNT_ERROR,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify verification code",
    });
  }
};

export const resendVerificationCode =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const {
        identifier,
      } = req.body;

      if (
        typeof identifier !== "string" ||
        !identifier.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Mobile number or email address is required",
        });
      }

      const result =
        await resendPasswordResetCode(
          identifier,
        );

      return res.status(200).json({
        success: true,
        message:
          "A new verification code has been sent",
        data: result,
      });
    } catch (error) {
      console.error(
        "Resend password reset code error:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to resend verification code";

      if (
        message ===
        RESEND_COOLDOWN_ERROR
      ) {
        return res.status(429).json({
          success: false,
          message,
        });
      }

      if (
  message ===
  "Unable to send verification SMS"
) {
  return res.status(502).json({
    success: false,
    message,
  });
}

      if (
        message === NO_ACCOUNT_ERROR
      ) {
        return res.status(404).json({
          success: false,
          message: NO_ACCOUNT_ERROR,
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to resend verification code",
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
        message:
          "Password reset session is required",
      });
    }

    if (
      typeof newPassword !== "string" ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New password is required",
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
      message === RESET_SESSION_ERROR ||
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
      message:
        "Unable to reset password",
    });
  }
};


export const verifyRecoveryPassword = async (
  req: Request,
  res: Response,
) => {
  try {
    const { identifier, password } = req.body;

    if (
      typeof identifier !== "string" ||
      !identifier.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number or email address is required",
      });
    }

    if (
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const data =
      await verifyPasswordForRecovery(
        identifier.trim(),
        password,
      );

    return res.status(200).json({
      success: true,
      message: "Password verified successfully",
      data,
    });
  } catch (error) {
    console.error(
      "Recovery password verification error:",
      error,
    );

    return res.status(401).json({
      success: false,
      message:
        "Incorrect password. Please try again.",
    });
  }
};