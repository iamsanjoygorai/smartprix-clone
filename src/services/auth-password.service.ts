import bcrypt from "bcryptjs";
import crypto from "crypto";

import prisma from "../db/prisma";
import { sendPasswordResetCodeEmail } from "./email.service";
import { loginUser } from "./auth.service";
import { sendPasswordResetCodeSms } from "./sms.service";
import {
  sendTwoFactorOtp,
  verifyTwoFactorOtp,
} from "./twofactor.service";

export const NO_ACCOUNT_ERROR =
  "No account found. Check your mobile number or email address and try again.";

export const INVALID_CODE_ERROR =
  "The verification code is invalid.";

export const EXPIRED_CODE_ERROR =
  "The verification code has expired. Please request a new code.";

export const TOO_MANY_ATTEMPTS_ERROR =
  "Too many incorrect attempts. Please request a new code.";

export const RESEND_COOLDOWN_ERROR =
  "Please wait before requesting another code.";

export const RESET_SESSION_ERROR =
  "Your password reset session is invalid or expired.";

function normalizeIdentifier(identifier: string) {
  return identifier.trim();
}

function normalizeMobile(identifier: string) {
  return identifier.replace(/\D/g, "");
}

function hashToken(value: string) {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
}

function generateVerificationCode() {
  return crypto
    .randomInt(100000, 1000000)
    .toString();
}

function maskEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return "***";
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}***@${domain}`;
  }

  return `${localPart[0]}${"*".repeat(
    Math.min(Math.max(localPart.length - 2, 3), 6),
  )}${localPart[localPart.length - 1]}@${domain}`;
}

function maskMobile(mobile: string | null) {
  if (!mobile) {
    return null;
  }

  const digits = mobile.replace(/\D/g, "");

  if (digits.length < 4) {
    return "••••";
  }

  return `••••${digits.slice(-4)}`;
}

async function findUserByIdentifier(
  identifier: string,
) {
  const normalizedIdentifier =
    normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  const normalizedMobile =
    normalizeMobile(normalizedIdentifier);

  return prisma.user.findFirst({
    where: {
      OR: [
        {
          email:
            normalizedIdentifier.toLowerCase(),
        },
        ...(normalizedMobile.length >= 10
          ? [
              {
                mobile: normalizedMobile,
              },
            ]
          : []),
      ],
    },
    select: {
      id: true,
      email: true,
      mobile: true,
      isDisabled: true,
    },
  });
}

/**
 * STEP 1
 *
 * Find the account but do NOT send a verification
 * code yet.
 */
export const findPasswordRecoveryAccount = async (
  identifier: string,
) => {
  const user =
    await findUserByIdentifier(identifier);
    console.log("PASSWORD RECOVERY USER:", {
  id: user?.id,
  hasEmail: !!user?.email,
  hasMobile: !!user?.mobile,
  mobileLength: user?.mobile?.length ?? 0,
});

  if (!user || user.isDisabled) {
    throw new Error(NO_ACCOUNT_ERROR);
  }

  const recoveryMethods = [];

  if (user.email) {
    recoveryMethods.push({
      type: "email" as const,
      label: `Send code to ${maskEmail(
        user.email,
      )}`,
    });
  }

  if (user.mobile) {
    recoveryMethods.push({
      type: "sms" as const,
      label: `Send code to ${maskMobile(
        user.mobile,
      )}`,
    });
  }

  return {
    userId: user.id,
    email: user.email,
    mobile: user.mobile,
    maskedEmail: user.email
      ? maskEmail(user.email)
      : null,
    maskedMobile: maskMobile(
      user.mobile,
    ),
    recoveryMethods,
  };
};

/**
 * STEP 3
 *
 * Generate and send the 6-digit verification code.
 */
export const sendPasswordResetCode = async (
  identifier: string,
) => {
  const user =
    await findUserByIdentifier(identifier);

  if (!user || user.isDisabled) {
    throw new Error(NO_ACCOUNT_ERROR);
  }

  const now = Date.now();

  const existingUser =
    await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        passwordResetCodeSentAt: true,
      },
    });

  if (
    existingUser?.passwordResetCodeSentAt &&
    now -
      existingUser.passwordResetCodeSentAt.getTime() <
      60 * 1000
  ) {
    throw new Error(
      RESEND_COOLDOWN_ERROR,
    );
  }

  /*
   * EMAIL ACCOUNT
   *
   * Keep the existing email OTP system unchanged.
   */
  if (user.email) {
    const code =
      generateVerificationCode();

    const codeHash =
      hashToken(code);

    const codeExpiresAt =
      new Date(
        now + 10 * 60 * 1000,
      );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetCodeHash:
          codeHash,

        passwordResetCodeExpiresAt:
          codeExpiresAt,

        passwordResetCodeAttempts: 0,

        passwordResetCodeSentAt:
          new Date(now),

        passwordResetOtpSessionId:
          null,

        resetPasswordTokenHash:
          null,

        resetPasswordExpiresAt:
          null,
      },
    });

    await sendPasswordResetCodeEmail(
      user.email,
      code,
    );

    return {
      deliveryMethod: "email" as const,

      maskedEmail:
        maskEmail(user.email),

      maskedMobile:
        maskMobile(user.mobile),

      expiresInSeconds:
        10 * 60,

      resendAfterSeconds: 60,
    };
  }

  /*
   * MOBILE ACCOUNT
   *
   * Use 2Factor AUTOGEN.
   */
  if (user.mobile) {
    try {
      const result =
        await sendTwoFactorOtp(
          user.mobile,
        );

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordResetCodeHash:
            null,

          passwordResetCodeExpiresAt:
            new Date(
              now + 10 * 60 * 1000,
            ),

          passwordResetCodeAttempts: 0,

          passwordResetCodeSentAt:
            new Date(now),

          passwordResetOtpSessionId:
            result.sessionId,

          resetPasswordTokenHash:
            null,

          resetPasswordExpiresAt:
            null,
        },
      });

      return {
        deliveryMethod: "sms" as const,

        maskedEmail: null,

        maskedMobile:
          maskMobile(user.mobile),

        expiresInSeconds:
          10 * 60,

        resendAfterSeconds: 60,
      };
    } catch (error) {
      console.error(
        "2Factor OTP send failed:",
        error,
      );

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordResetCodeHash:
            null,

          passwordResetCodeExpiresAt:
            null,

          passwordResetCodeAttempts: 0,

          passwordResetCodeSentAt:
            null,

          passwordResetOtpSessionId:
            null,
        },
      });

      throw new Error(
        "Unable to send verification SMS",
      );
    }
  }

  throw new Error(
    NO_ACCOUNT_ERROR,
  );
};

/**
 * STEP 4
 *
 * Verify the 6-digit code.
 *
 * A temporary reset token is generated only after
 * successful verification.
 */
export const verifyPasswordResetCode = async (
  identifier: string,
  code: string,
) => {
  const user =
    await findUserByIdentifier(identifier);

  if (!user || user.isDisabled) {
    throw new Error(
      INVALID_CODE_ERROR,
    );
  }

  const resetData =
    await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        email: true,
        mobile: true,

        passwordResetCodeHash: true,

        passwordResetCodeExpiresAt: true,

        passwordResetCodeAttempts: true,

        passwordResetOtpSessionId: true,
      },
    });

  if (
    !resetData?.passwordResetCodeExpiresAt
  ) {
    throw new Error(
      EXPIRED_CODE_ERROR,
    );
  }

  /*
   * OTP expiration
   */
  if (
    resetData.passwordResetCodeExpiresAt.getTime() <=
    Date.now()
  ) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetCodeHash:
          null,

        passwordResetCodeExpiresAt:
          null,

        passwordResetCodeAttempts:
          0,

        passwordResetCodeSentAt:
          null,

        passwordResetOtpSessionId:
          null,
      },
    });

    throw new Error(
      EXPIRED_CODE_ERROR,
    );
  }

  /*
   * Maximum attempts
   */
  if (
    resetData.passwordResetCodeAttempts >=
    5
  ) {
    throw new Error(
      TOO_MANY_ATTEMPTS_ERROR,
    );
  }

  /*
   * MOBILE / 2FACTOR
   */
  if (
    resetData.mobile &&
    resetData.passwordResetOtpSessionId
  ) {
    try {
      await verifyTwoFactorOtp(
        resetData.passwordResetOtpSessionId,
        code,
      );
    } catch (error) {
      console.error(
        "2Factor OTP verification failed:",
        error,
      );

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordResetCodeAttempts: {
            increment: 1,
          },
        },
      });

      throw new Error(
        INVALID_CODE_ERROR,
      );
    }
  }

  /*
   * EMAIL / LOCAL OTP
   */
  else if (
    resetData.passwordResetCodeHash
  ) {
    const suppliedCodeHash =
      hashToken(code.trim());

    const codeMatches =
      crypto.timingSafeEqual(
        Buffer.from(
          suppliedCodeHash,
          "utf8",
        ),
        Buffer.from(
          resetData.passwordResetCodeHash,
          "utf8",
        ),
      );

    if (!codeMatches) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordResetCodeAttempts: {
            increment: 1,
          },
        },
      });

      throw new Error(
        INVALID_CODE_ERROR,
      );
    }
  } else {
    throw new Error(
      EXPIRED_CODE_ERROR,
    );
  }

  /*
   * OTP successfully verified.
   *
   * Generate a temporary password-reset token.
   */
  const resetToken =
    crypto.randomBytes(32).toString("hex");

  const resetTokenHash =
    hashToken(resetToken);

  const resetExpiresAt =
    new Date(
      Date.now() + 15 * 60 * 1000,
    );

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      resetPasswordTokenHash:
        resetTokenHash,

      resetPasswordExpiresAt:
        resetExpiresAt,

      passwordResetCodeHash:
        null,

      passwordResetCodeExpiresAt:
        null,

      passwordResetCodeAttempts:
        0,

      passwordResetCodeSentAt:
        null,

      passwordResetOtpSessionId:
        null,
    },
  });

  return {
    resetToken,

    expiresInSeconds:
      15 * 60,
  };
};

/**
 * STEP 4 RESEND
 */
export const resendPasswordResetCode = async (
  identifier: string,
) => {
  return sendPasswordResetCode(
    identifier,
  );
};

export const verifyPasswordForRecovery = async (
  identifier: string,
  password: string,
) => {
  try {
    return await loginUser({
      identifier,
      password,
    });
  } catch (error) {
    throw new Error(
      "Incorrect password. Please try again.",
    );
  }
};


/**
 * STEP 5
 *
 * Create the new password using the temporary
 * reset session generated after code verification.
 */
export const resetPassword = async (
  token: string,
  newPassword: string,
) => {
  const tokenHash = hashToken(token);

  const user =
    await prisma.user.findFirst({
      where: {
        resetPasswordTokenHash:
          tokenHash,

        resetPasswordExpiresAt: {
          gt: new Date(),
        },
      },

      select: {
        id: true,
        passwordHash: true,
        isDisabled: true,
      },
    });

  if (
    !user ||
    user.isDisabled
  ) {
    throw new Error(
      RESET_SESSION_ERROR,
    );
  }

  if (user.passwordHash) {
    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.passwordHash,
      );

    if (samePassword) {
      throw new Error(
        "New password must be different from your current password",
      );
    }
  }

  const passwordHash =
    await bcrypt.hash(
      newPassword,
      12,
    );

  await prisma.user.update({
    where: {
      id: user.id,
    },

    data: {
      passwordHash,

      // One-time reset session.
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,

      passwordResetCodeHash: null,
      passwordResetCodeExpiresAt: null,
      passwordResetCodeAttempts: 0,
      passwordResetCodeSentAt: null,
    },
  });
};