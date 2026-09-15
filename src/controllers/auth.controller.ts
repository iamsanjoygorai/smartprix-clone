import { Request, Response } from "express";

import { loginSchema } from "../validators/auth.validator";
import {
  loginUser,
  registerUser,
} from "../services/auth.service";

import { registerSchema } from "../validators/register.validator";
import prisma from "../db/prisma";

import {
  createAuditLog,
} from "../modules/audit/audit.service";

import {
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
} from "../modules/audit/audit.constants";
import { buildAuditChanges } from "../modules/audit/audit-change";
import historyService from "../modules/history/history.service";
import {
  HISTORY_CATEGORY,
  HISTORY_EVENTS,
  HISTORY_OPERATION,
} from "../modules/history/history.constants";

/* =========================================================
   HELPERS
========================================================= */

/**
 * Extract the authenticated user id from a service response.
 *
 * Different authentication flows may return:
 * - { id }
 * - { user: { id } }
 * - { data: { id } }
 * - { data: { user: { id } } }
 */
function extractUserId(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const value = data as Record<string, unknown>;

  if (typeof value.id === "string") {
    return value.id;
  }

  if (
    value.user &&
    typeof value.user === "object"
  ) {
    const user = value.user as Record<string, unknown>;

    if (typeof user.id === "string") {
      return user.id;
    }
  }

  if (
    value.data &&
    typeof value.data === "object"
  ) {
    return extractUserId(value.data);
  }

  return null;
}

/**
 * Build safe request information for audit logs.
 *
 * Never put passwords, tokens, OTPs or cookies into audit metadata.
 */
function getAuditRequestInfo(req: Request) {
  return {
    ipAddress:
      req.ip ||
      req.socket?.remoteAddress ||
      null,

    userAgent:
      req.get("user-agent") || null,

    timezone:
      req.get("x-timezone") ||
      (typeof req.body?.timezone === "string"
        ? req.body.timezone
        : null),
  };
}
/**
 * Detect the login method without storing the actual credential.
 */
function getLoginMethod(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "unknown";
  }

  const value = data as Record<string, unknown>;

  if (
    typeof value.email === "string" &&
    value.email.trim()
  ) {
    return "email";
  }

  if (
    typeof value.mobile === "string" &&
    value.mobile.trim()
  ) {
    return "mobile";
  }

  if (
    typeof value.identifier === "string" &&
    value.identifier.trim()
  ) {
    const identifier = value.identifier.trim();

    if (/^\d{10}$/.test(identifier)) {
      return "mobile";
    }

    if (identifier.includes("@")) {
      return "email";
    }
  }

  return "unknown";
}

const AUTH_COOKIE_NAME = "smartprix_auth";

function setAuthCookie(
  res: Response,
  token: string,
) {

  /* =======================================================
   END CURRENT SESSION
======================================================= */

 
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite:
      process.env.NODE_ENV === "production"
        ? "none"
        : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}


/* =========================================================
   REGISTER
========================================================= */

export const register = async (
  req: Request,
  res: Response,
) => {
  try {
    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid registration data",
        errors: result.error.flatten(),
      });
      return;
    }

    const input = result.data;

    /* -------------------------------------------------------
       CREATE USER
    ------------------------------------------------------- */

    const resultUser = await registerUser(input);

    const user = resultUser.user;

    /* -------------------------------------------------------
       REQUEST INFO
    ------------------------------------------------------- */

    const auditRequest = getAuditRequestInfo(req);

    /* -------------------------------------------------------
       AUDIT LOG
    ------------------------------------------------------- */

    await createAuditLog({
      actorUserId: user.id,
      targetUserId: user.id,
      action: "ACCOUNT_REGISTERED",
      category: AUDIT_CATEGORIES.AUTH,
      entityType: "User",
      entityId: user.id,
      description: "A new user account was registered.",
      metadata: {
        method: input.email
          ? "email"
          : "mobile",
      },
      ipAddress: auditRequest.ipAddress,
      userAgent: auditRequest.userAgent,
    });

    /* -------------------------------------------------------
       GIT-LIKE HISTORY
    ------------------------------------------------------- */

    await historyService.record({
      actorUserId: user.id,
      targetUserId: user.id,

      category: HISTORY_CATEGORY.USER,

      eventType: HISTORY_EVENTS.USER_CREATED,

      operation: HISTORY_OPERATION.CREATE,

      entityType: "User",
      entityId: user.id,

      title: "Account created",

      description:
        "A new user account was created through public registration.",

      changes: {
        name: {
          before: null,
          after: user.name,
        },

        email: {
          before: null,
          after: user.email,
        },

        mobile: {
          before: null,
          after: user.mobile,
        },

        role: {
          before: null,
          after: user.role,
        },
      },

      metadata: {
        method: input.email
          ? "email"
          : "mobile",
      },
    });

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: resultUser,
    });
  } catch (error) {
    console.error("Registration failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Registration failed";

    if (
      message === "Email already registered" ||
      message === "Mobile number already registered"
    ) {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

/* =========================================================
   LOGIN
========================================================= */

export const login = async (
  req: Request,
  res: Response,
) => {
  const auditRequest = getAuditRequestInfo(req);

  try {
    const result = loginSchema.safeParse(
      req.body,
    );

    /* =======================================================
       INVALID LOGIN DATA
    ======================================================= */

    if (!result.success) {
      await createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        category: AUDIT_CATEGORIES.AUTH,

        description:
          "Login failed because the submitted login data was invalid.",

        metadata: {
          reason: "INVALID_LOGIN_DATA",
        },

        ipAddress: auditRequest.ipAddress,
        userAgent: auditRequest.userAgent,
      });

      /* =======================================================
         HISTORY — LOGIN FAILED
      ======================================================= */

      await historyService.record({
        category: HISTORY_CATEGORY.SECURITY,
        eventType: HISTORY_EVENTS.LOGIN_FAILED,
        operation: HISTORY_OPERATION.LOGIN,

        title: "Login attempt failed",

        description:
          "Login failed because the submitted login data was invalid.",

        metadata: {
          reason: "INVALID_LOGIN_DATA",
        },

        ipAddress: auditRequest.ipAddress,
        userAgent: auditRequest.userAgent,
      });

      res.status(400).json({
        success: false,
        message: "Invalid login data",
        errors: result.error.flatten().fieldErrors,
      });

      return;
    }

    /* =======================================================
       LOGIN
    ======================================================= */

    const data = await loginUser(
      result.data,
      req,
    );

    if (
  data &&
  typeof data === "object" &&
  "token" in data &&
  typeof data.token === "string"
) {
  setAuthCookie(res, data.token);
}

    console.log(
      "LOGIN SESSION ID:",
      data.sessionId,
    );

    const userId = extractUserId(data);

    /* =======================================================
       AUDIT — LOGIN SUCCESS
    ======================================================= */

    await createAuditLog({
      actorUserId: userId,
      targetUserId: userId,

      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      category: AUDIT_CATEGORIES.AUTH,

      entityType: "User",
      entityId: userId,

      sessionId:
        typeof data.sessionId === "string"
          ? data.sessionId
          : null,

      description:
        "User logged in successfully.",

      metadata: {
        method: getLoginMethod(result.data),
      },

      ipAddress: auditRequest.ipAddress,
      userAgent: auditRequest.userAgent,
    });

    /* =======================================================
       HISTORY — LOGIN SUCCESS
    ======================================================= */

    await historyService.record({
      actorUserId: userId,
      targetUserId: userId,

      ipAddress: auditRequest.ipAddress,
      userAgent: auditRequest.userAgent,

      category: HISTORY_CATEGORY.SECURITY,
      eventType: HISTORY_EVENTS.LOGIN,
      operation: HISTORY_OPERATION.LOGIN,

      entityType: "User",
      entityId: userId,

      title: "User logged in",

      description:
        "User successfully logged in.",

      metadata: {
        method: getLoginMethod(result.data),
      },
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (error) {
    console.error(
      "Login failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Login failed";

    console.log(
      "LOGIN ERROR MESSAGE:",
      message,
    );

    /*
     * Authentication failures are useful security events.
     *
     * IMPORTANT:
     * Do not store the submitted password.
     */

    await createAuditLog({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      category: AUDIT_CATEGORIES.AUTH,

      description:
        "User login attempt failed.",

      metadata: {
        reason:
          message === "Invalid email or password"
            ? "INVALID_CREDENTIALS"
            : message === "Account is disabled"
              ? "ACCOUNT_DISABLED"
              : "AUTHENTICATION_ERROR",

        method: getLoginMethod(req.body),
      },

      ipAddress: auditRequest.ipAddress,
      userAgent: auditRequest.userAgent,
    }).catch((auditError) => {
      console.error(
        "Failed to create login audit:",
        auditError,
      );
    });

    /* =======================================================
   HISTORY — AUTHENTICATION FAILURE
======================================================= */

const failureReason =
  message === "Invalid email or password"
    ? "INVALID_CREDENTIALS"
    : message === "Account is disabled"
      ? "ACCOUNT_DISABLED"
      : "AUTHENTICATION_ERROR";

await historyService.record({
  category: HISTORY_CATEGORY.SECURITY,
  eventType: HISTORY_EVENTS.LOGIN_FAILED,
  operation: HISTORY_OPERATION.LOGIN,

  title: "Login attempt failed",

  description:
    "User login attempt failed during authentication.",

  metadata: {
    reason: failureReason,
    method: getLoginMethod(req.body),
  },

  ipAddress: auditRequest.ipAddress,
  userAgent: auditRequest.userAgent,
});

    if (
      message === "Invalid email or password" ||
      message === "Account is disabled"
    ) {
      res.status(401).json({
        success: false,
        message,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/* =========================================================
   LOGOUT
========================================================= */

export const logout = async (
  req: Request,
  res: Response,
) => {
  try {
    const authUser =
      typeof req.user === "object" &&
      req.user !== null
        ? req.user
        : null;

    const userId =
      authUser &&
      "userId" in authUser &&
      typeof authUser.userId === "string"
        ? authUser.userId
        : null;

    const sessionId =
      authUser &&
      "sessionId" in authUser &&
      typeof authUser.sessionId === "string"
        ? authUser.sessionId
        : null;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const auditRequest =
      getAuditRequestInfo(req);

    /* =======================================================
       END CURRENT SESSION
    ======================================================= */

    if (sessionId) {
      await prisma.userSession.updateMany({
        where: {
          id: sessionId,
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
          endedAt: new Date(),
          lastSeenAt: new Date(),
        },
      });
    }

    /* =======================================================
       CLEAR AUTHENTICATION COOKIE
    ======================================================= */

    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      path: "/",
    });

    /* =======================================================
       AUDIT — LOGOUT
    ======================================================= */

    await createAuditLog({
      actorUserId: userId,
      targetUserId: userId,
      action: AUDIT_ACTIONS.LOGOUT,
      category: AUDIT_CATEGORIES.AUTH,
      entityType: "User",
      entityId: userId,
      sessionId: sessionId ?? null,
      description:
        "User logged out successfully.",
      metadata: {
        sessionEnded: Boolean(sessionId),
      },
      ipAddress:
        auditRequest.ipAddress,
      userAgent:
        auditRequest.userAgent,
    });

    /* =======================================================
       HISTORY — LOGOUT
    ======================================================= */

    await historyService.record({
      actorUserId: userId,
      targetUserId: userId,
      category:
        HISTORY_CATEGORY.SECURITY,
      eventType:
        HISTORY_EVENTS.LOGOUT,
      operation:
        HISTORY_OPERATION.LOGOUT,
      entityType: "User",
      entityId: userId,
      title: "User logged out",
      description:
        "User successfully logged out.",
      sessionId:
        sessionId ?? null,
      ipAddress:
        auditRequest.ipAddress,
      userAgent:
        auditRequest.userAgent,
      metadata: {
        sessionEnded:
          Boolean(sessionId),
      },
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error(
      "Logout failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};