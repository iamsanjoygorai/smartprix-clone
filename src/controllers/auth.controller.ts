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

    if (!result.success) {
      await createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        category: AUDIT_CATEGORIES.AUTH,

        description:
          "Login failed because the submitted login data was invalid.",

        metadata: {
          reason: "INVALID_LOGIN_DATA",
        },

        ipAddress:
          auditRequest.ipAddress,

        userAgent:
          auditRequest.userAgent,
      });

      res.status(400).json({
        success: false,
        message: "Invalid login data",
        errors:
          result.error.flatten().fieldErrors,
      });

      return;
    }

    const data = await loginUser(
  result.data,
  req,
);
console.log("LOGIN SESSION ID:", data.sessionId);

    const userId = extractUserId(data);

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
    method:
      getLoginMethod(result.data),
  },

  ipAddress:
    auditRequest.ipAddress,

  userAgent:
    auditRequest.userAgent,
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

        method:
          getLoginMethod(req.body),
      },

      ipAddress:
        auditRequest.ipAddress,

      userAgent:
        auditRequest.userAgent,
    }).catch((auditError) => {
      console.error(
        "Failed to create login audit:",
        auditError,
      );
    });

    if (
      message ===
        "Invalid email or password" ||
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
   FIREBASE LOGIN
========================================================= */

export const firebaseLogin = async (
  req: Request,
  res: Response,
) => {
  const auditRequest = getAuditRequestInfo(req);

  try {
    const { idToken } = req.body;

    if (
      typeof idToken !== "string" ||
      !idToken.trim()
    ) {
      await createAuditLog({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        category: AUDIT_CATEGORIES.AUTH,

        description:
          "Firebase login failed because no ID token was supplied.",

        metadata: {
          method: "firebase",
          reason: "MISSING_ID_TOKEN",
        },

        ipAddress:
          auditRequest.ipAddress,

        userAgent:
          auditRequest.userAgent,
      });

      res.status(400).json({
        success: false,
        message:
          "Firebase ID token is required",
      });

      return;
    }

    const data =
      await loginWithFirebase(idToken);

    const userId =
      extractUserId(data);

    await createAuditLog({
      actorUserId: userId,
      targetUserId: userId,

      action: AUDIT_ACTIONS.LOGIN_SUCCESS,
      category: AUDIT_CATEGORIES.AUTH,

      description:
        "User logged in successfully using Firebase authentication.",

      metadata: {
        method: "firebase",
      },

      ipAddress:
        auditRequest.ipAddress,

      userAgent:
        auditRequest.userAgent,
    });

    res.status(200).json({
      success: true,
      message:
        "Firebase login successful",
      data,
    });
  } catch (error) {
    console.error(
      "Firebase login failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Firebase login failed";

    await createAuditLog({
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      category: AUDIT_CATEGORIES.AUTH,

      description:
        "Firebase authentication failed.",

      metadata: {
        method: "firebase",
        reason:
          message === "Account is disabled"
            ? "ACCOUNT_DISABLED"
            : "FIREBASE_AUTHENTICATION_FAILED",
      },

      ipAddress:
        auditRequest.ipAddress,

      userAgent:
        auditRequest.userAgent,
    }).catch((auditError) => {
      console.error(
        "Failed to create Firebase login audit:",
        auditError,
      );
    });

    if (
      message === "Account is disabled"
    ) {
      res.status(401).json({
        success: false,
        message,
      });

      return;
    }

    res.status(401).json({
      success: false,
      message:
        "Firebase authentication failed",
    });
  }
};

/* =========================================================
   REGISTER
========================================================= */

export const register = async (
  req: Request,
  res: Response,
) => {
  const auditRequest =
    getAuditRequestInfo(req);

  try {
    const result =
      registerSchema.safeParse(
        req.body,
      );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message:
          "Invalid registration data",
        errors:
          result.error.flatten().fieldErrors,
      });

      return;
    }

    const data =
      await registerUser(result.data);

    const userId =
      extractUserId(data);

    await createAuditLog({
      actorUserId: userId,
      targetUserId: userId,

      action:
        AUDIT_ACTIONS.ACCOUNT_REGISTERED,

      category:
        AUDIT_CATEGORIES.ACCOUNT,

      description:
        "A new user account was registered.",

      metadata: {
        method: "standard_registration",
      },

      ipAddress:
        auditRequest.ipAddress,

      userAgent:
        auditRequest.userAgent,
    });

    res.status(201).json({
      success: true,
      message:
        "Registration successful",
      data,
    });
  } catch (error) {
    console.error(
      "Registration failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Registration failed";

    if (
      message ===
        "Email already registered" ||
      message ===
        "Mobile number already registered"
    ) {
      res.status(409).json({
        success: false,
        message,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message:
        "Registration failed",
    });
  }
};

/* =========================================================
   GET CURRENT USER
========================================================= */

export const getMe = async (
  req: Request,
  res: Response,
) => {
  try {
    /*
     * Authentication middleware should attach
     * the decoded JWT payload to req.user.
     */

    if (
      !req.user ||
      typeof req.user === "string"
    ) {
      res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const userId =
      req.user.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });

      return;
    }

    /* -------------------------------------------------------
       FETCH USER
    ------------------------------------------------------- */

    const user =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },

          userPermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    /* -------------------------------------------------------
       DISABLED ACCOUNT
    ------------------------------------------------------- */

    if (user.isDisabled) {
      res.status(401).json({
        success: false,
        message:
          "Account is disabled",
      });

      return;
    }

    /* -------------------------------------------------------
       ROLE PERMISSIONS
    ------------------------------------------------------- */

    const effectivePermissions =
      new Set<string>(
        user.userRoles.flatMap(
          (userRole) =>
            userRole.role.permissions.map(
              (rolePermission) =>
                rolePermission.permission
                  .name,
            ),
        ),
      );

    /* -------------------------------------------------------
       SUPER ADMIN
    ------------------------------------------------------- */

    if (
      user.role === "SUPER_ADMIN"
    ) {
      const allPermissions =
        await prisma.permission.findMany({
          select: {
            name: true,
          },
        });

      for (
        const permission of allPermissions
      ) {
        effectivePermissions.add(
          permission.name,
        );
      }
    } else {
      /* -----------------------------------------------------
         INDIVIDUAL PERMISSION OVERRIDES
      ----------------------------------------------------- */

      for (
        const override of
          user.userPermissions
      ) {
        if (override.allowed) {
          effectivePermissions.add(
            override.permission.name,
          );
        } else {
          effectivePermissions.delete(
            override.permission.name,
          );
        }
      }
    }

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    res.status(200).json({
      success: true,

      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,

        profileImageUrl:
          user.profileImageUrl,

        dateOfBirth:
          user.dateOfBirth,

        gender:
          user.gender,

        role:
          user.role,

        isDisabled:
          user.isDisabled,

        createdAt:
          user.createdAt,

        updatedAt:
          user.updatedAt,

        permissions:
          Array.from(
            effectivePermissions,
          ),
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch current user:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch current user",
    });
  }
};

/* =========================================================
   UPDATE PROFILE
========================================================= */

export const updateProfile = async (
  req: Request,
  res: Response,
) => {
  try {
    /* -------------------------------------------------------
       AUTHENTICATION
    ------------------------------------------------------- */

    if (
      !req.user ||
      typeof req.user === "string"
    ) {
      res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const userId =
      req.user.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });

      return;
    }

    /* -------------------------------------------------------
       ACCEPT ONLY PROFILE FIELDS
    ------------------------------------------------------- */

    const {
      name,
      mobile,
      dateOfBirth,
      gender,
    } = req.body;

    /* -------------------------------------------------------
       VALIDATE NAME
    ------------------------------------------------------- */

    if (
      name !== undefined &&
      name !== null &&
      typeof name !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid name",
      });

      return;
    }

    if (
      typeof name === "string" &&
      name.trim().length > 100
    ) {
      res.status(400).json({
        success: false,
        message: "Name is too long",
      });

      return;
    }

    /* -------------------------------------------------------
       VALIDATE MOBILE
    ------------------------------------------------------- */

    if (
      mobile !== undefined &&
      mobile !== null &&
      typeof mobile !== "string"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid mobile number",
      });

      return;
    }

    const cleanMobile =
      typeof mobile === "string"
        ? mobile.trim()
        : mobile;

    if (
      cleanMobile &&
      !/^[0-9]{10}$/.test(cleanMobile)
    ) {
      res.status(400).json({
        success: false,
        message:
          "Mobile number must contain exactly 10 digits",
      });

      return;
    }

    /* -------------------------------------------------------
       VALIDATE DATE OF BIRTH
    ------------------------------------------------------- */

    let parsedDateOfBirth:
      | Date
      | null
      | undefined = undefined;

    if (
      dateOfBirth !== undefined &&
      dateOfBirth !== null &&
      dateOfBirth !== ""
    ) {
      if (
        typeof dateOfBirth !== "string"
      ) {
        res.status(400).json({
          success: false,
          message:
            "Invalid date of birth",
        });

        return;
      }

      const parsedDate =
        new Date(dateOfBirth);

      if (
        Number.isNaN(
          parsedDate.getTime(),
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            "Invalid date of birth",
        });

        return;
      }

      parsedDateOfBirth =
        parsedDate;
    } else if (
      dateOfBirth === null ||
      dateOfBirth === ""
    ) {
      parsedDateOfBirth = null;
    }

    /* -------------------------------------------------------
       VALIDATE GENDER
    ------------------------------------------------------- */

    if (
      gender !== undefined &&
      gender !== null &&
      typeof gender !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid gender",
      });

      return;
    }

    const cleanGender =
      typeof gender === "string"
        ? gender.trim()
        : gender;

    const allowedGenders = [
      "MALE",
      "FEMALE",
      "OTHER",
      "PREFER_NOT_TO_SAY",
    ];

    if (
      cleanGender &&
      !allowedGenders.includes(
        cleanGender.toUpperCase(),
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid gender",
      });

      return;
    }

    /* -------------------------------------------------------
       CHECK MOBILE DUPLICATE
    ------------------------------------------------------- */

    if (cleanMobile) {
      const existingUser =
        await prisma.user.findFirst({
          where: {
            mobile: cleanMobile,

            NOT: {
              id: userId,
            },
          },

          select: {
            id: true,
          },
        });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message:
            "Mobile number already registered",
        });

        return;
      }
    }

    /* -------------------------------------------------------
       GET OLD PROFILE
       Used only to record what changed.
    ------------------------------------------------------- */

    const oldUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          name: true,
          mobile: true,
          dateOfBirth: true,
          gender: true,
        },
      });

    /* -------------------------------------------------------
       UPDATE USER
    ------------------------------------------------------- */

    const user =
      await prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          ...(name !== undefined && {
            name:
              typeof name === "string"
                ? name.trim() || null
                : null,
          }),

          ...(mobile !== undefined && {
            mobile:
              cleanMobile || null,
          }),

          ...(parsedDateOfBirth !==
            undefined && {
            dateOfBirth:
              parsedDateOfBirth,
          }),

          ...(gender !== undefined && {
            gender:
              cleanGender
                ? cleanGender.toUpperCase()
                : null,
          }),
        },

        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          dateOfBirth: true,
          gender: true,
          role: true,
          isDisabled: true,
          profileImageUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    /* -------------------------------------------------------
       AUDIT PROFILE UPDATE
    ------------------------------------------------------- */

  const changes = buildAuditChanges(
  {
    name: oldUser?.name ?? null,
    mobile: oldUser?.mobile ?? null,
    dateOfBirth: oldUser?.dateOfBirth ?? null,
    gender: oldUser?.gender ?? null,
  },
  {
    name: user.name ?? null,
    mobile: user.mobile ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    gender: user.gender ?? null,
  },
  [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "mobile",
      label: "Mobile",
    },
    {
      key: "dateOfBirth",
      label: "Date of Birth",
    },
    {
      key: "gender",
      label: "Gender",
    },
  ],
);

if (changes.length > 0) {
  const auditRequest = getAuditRequestInfo(req);

  await createAuditLog({
    actorUserId: userId,
    targetUserId: userId,
    action: AUDIT_ACTIONS.PROFILE_UPDATED,
    category: AUDIT_CATEGORIES.PROFILE,
    entityType: "User",
    entityId: userId,
    description: "User profile was updated.",
    metadata: {
      changes,
    },
    ipAddress: auditRequest.ipAddress,
    userAgent: auditRequest.userAgent,
  });
}

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    res.status(200).json({
      success: true,
      message:
        "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error(
      "Failed to update profile:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update profile",
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
    /* =====================================================
       AUTH USER
    ===================================================== */

    if (
      !req.user ||
      typeof req.user === "string"
    ) {
      res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });

      return;
    }

    const userId =
      req.user.userId;

    const sessionId =
      req.user.sessionId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });

      return;
    }

    /* =====================================================
       END CURRENT USER SESSION
    ===================================================== */

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

    /* =====================================================
       AUDIT REQUEST INFO
    ===================================================== */

    const auditRequest =
      getAuditRequestInfo(req);

    /* =====================================================
       AUDIT LOG
    ===================================================== */

    await createAuditLog({
      actorUserId: userId,

      targetUserId: userId,

      action:
        AUDIT_ACTIONS.LOGOUT,

      category:
        AUDIT_CATEGORIES.AUTH,

      entityType: "User",

      entityId: userId,

      sessionId:
        sessionId ?? null,

      description:
        "User logged out.",

      metadata: {
        method: "manual",
      },

      ipAddress:
        auditRequest.ipAddress,

      userAgent:
        auditRequest.userAgent,
    });

    if (sessionId) {
  await createAuditLog({
    actorUserId: userId,
    targetUserId: userId,
    action: AUDIT_ACTIONS.SESSION_ENDED,
    category: AUDIT_CATEGORIES.SESSION,
    entityType: "UserSession",
    entityId: sessionId,
    sessionId,
    description: "User session ended.",
    metadata: {
      reason: "logout",
    },
    ipAddress: auditRequest.ipAddress,
    userAgent: auditRequest.userAgent,
  });
}

    /* =====================================================
       RESPONSE
    ===================================================== */

    res.status(200).json({
      success: true,
      message:
        "Logout successful",
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