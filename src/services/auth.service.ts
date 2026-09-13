import bcrypt from "bcryptjs";

import prisma from "../db/prisma";

import { generateToken } from "../config/jwt";

import type { LoginInput } from "../validators/auth.validator";
import type { RegisterInput } from "../validators/register.validator";

/* =========================================================
   HELPERS
========================================================= */

function detectDeviceType(
  userAgent: string,
): string {
  const ua = userAgent.toLowerCase();

  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("ipad")
  ) {
    return "Mobile";
  }

  return "Desktop";
}

function detectBrowser(
  userAgent: string,
): string {
  if (/edg\//i.test(userAgent)) {
    return "Microsoft Edge";
  }

  if (/chrome\//i.test(userAgent)) {
    return "Google Chrome";
  }

  if (/firefox\//i.test(userAgent)) {
    return "Mozilla Firefox";
  }

  if (/safari\//i.test(userAgent) &&
      !/chrome\//i.test(userAgent)) {
    return "Safari";
  }

  if (/opr\//i.test(userAgent)) {
    return "Opera";
  }

  return "Unknown";
}

function detectOperatingSystem(
  userAgent: string,
): string {
  if (/windows/i.test(userAgent)) {
    return "Windows";
  }

  if (/android/i.test(userAgent)) {
    return "Android";
  }

  if (
    /iphone|ipad|ipod/i.test(userAgent)
  ) {
    return "iOS";
  }

  if (/macintosh|mac os x/i.test(userAgent)) {
    return "macOS";
  }

  if (/linux/i.test(userAgent)) {
    return "Linux";
  }

  return "Unknown";
}

/**
 * Build session information from the request.
 *
 * We intentionally store the IP and User-Agent,
 * but never store authentication credentials.
 */
function getSessionInfo(
  req?: {
    ip?: string;
    headers?: {
      [key: string]: string | string[] | undefined;
    };
    socket?: {
      remoteAddress?: string;
    };
  },
) {
  const userAgent =
    typeof req?.headers?.["user-agent"] ===
    "string"
      ? req.headers["user-agent"]
      : "";

  const ipAddress =
    req?.ip ||
    req?.socket?.remoteAddress ||
    null;

  return {
    ipAddress,
    userAgent: userAgent || null,

    deviceType: userAgent
      ? detectDeviceType(userAgent)
      : null,

    browser: userAgent
      ? detectBrowser(userAgent)
      : null,

    operatingSystem: userAgent
      ? detectOperatingSystem(userAgent)
      : null,
  };
}

/* =========================================================
   LOGIN
========================================================= */

export const loginUser = async (
  input: LoginInput,
  req?: {
    ip?: string;
    headers?: {
      [key: string]: string | string[] | undefined;
    };
    socket?: {
      remoteAddress?: string;
    };
  },
) => {
  const identifier =
    input.identifier.trim();

  if (!identifier) {
    throw new Error(
      "Invalid email or password",
    );
  }

  /*
   * Determine whether the user entered
   * an email or mobile.
   */

  const normalizedMobile =
    identifier.replace(/\D/g, "");

  const isEmail =
    identifier.includes("@");

  const user = isEmail
    ? await prisma.user.findUnique({
        where: {
          email:
            identifier.toLowerCase(),
        },
      })
    : await prisma.user.findFirst({
        where: {
          mobile: normalizedMobile,
        },
      });

  /* -------------------------------------------------------
     USER NOT FOUND
  ------------------------------------------------------- */

  if (!user || !user.passwordHash) {
    throw new Error(
      "Invalid email or password",
    );
  }

  /* -------------------------------------------------------
     DELETED ACCOUNT
  ------------------------------------------------------- */

  if (user.isDeleted) {
    throw new Error(
      "This account has been permanently deleted",
    );
  }

  /* -------------------------------------------------------
     DISABLED ACCOUNT
  ------------------------------------------------------- */

  if (user.isDisabled) {
    throw new Error(
      "Account is disabled",
    );
  }

  /* -------------------------------------------------------
     PASSWORD
  ------------------------------------------------------- */

  const passwordMatches =
    await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

  if (!passwordMatches) {
    throw new Error(
      "Invalid email or password",
    );
  }

  /* =======================================================
     ROLE PERMISSIONS
  ======================================================= */

  const userRoles =
    await prisma.userRole.findMany({
      where: {
        userId: user.id,
      },

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
    });

  const effectivePermissions =
    new Set<string>(
      userRoles.flatMap(
        (userRole) =>
          userRole.role.permissions.map(
            (rolePermission) =>
              rolePermission.permission
                .name,
          ),
      ),
    );

  /*
   * SUPER_ADMIN always has every permission.
   */

  if (user.role === "SUPER_ADMIN") {
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
    /*
     * Apply individual permission overrides.
     */

    const userOverrides =
      await prisma.userPermission.findMany({
        where: {
          userId: user.id,
        },

        include: {
          permission: true,
        },
      });

    for (
      const override of userOverrides
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

  const permissions =
    Array.from(
      effectivePermissions,
    );

  /* =======================================================
     TOKEN
  ======================================================= */

  /* =======================================================
   CREATE USER SESSION
======================================================= */

const sessionInfo =
  getSessionInfo(req);

const session =
  await prisma.userSession.create({
    data: {
      userId: user.id,

      startedAt: new Date(),

      lastSeenAt: new Date(),

      isActive: true,

      deviceType:
        sessionInfo.deviceType,

      browser:
        sessionInfo.browser,

      operatingSystem:
        sessionInfo.operatingSystem,

      ipAddress:
        sessionInfo.ipAddress,

      userAgent:
        sessionInfo.userAgent,
    },
  });

  console.log("USER SESSION CREATED:", session.id);

/* =======================================================
   TOKEN
======================================================= */

const token =
  generateToken({
    userId: user.id,
    role: user.role,
    sessionId: session.id,
  });

  /* =======================================================
     RESPONSE
  ======================================================= */

  return {
    token,

    sessionId: session.id,

    user: {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      role: user.role,
      permissions,
    },
  };
};

/* =========================================================
   REGISTER
========================================================= */

export const registerUser = async (
  input: RegisterInput,
) => {
  const email = input.email
    ? input.email
        .trim()
        .toLowerCase()
    : undefined;

  const mobile = input.mobile
    ? input.mobile.replace(/\D/g, "")
    : undefined;

  /* -------------------------------------------------------
     SAFETY CHECK
  ------------------------------------------------------- */

  if (!email && !mobile) {
    throw new Error(
      "Email address or mobile number is required",
    );
  }

  /* -------------------------------------------------------
     DUPLICATE EMAIL
  ------------------------------------------------------- */

  if (email) {
    const existingEmail =
      await prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      });

    if (existingEmail) {
      throw new Error(
        "Email already registered",
      );
    }
  }

  /* -------------------------------------------------------
     DUPLICATE MOBILE
  ------------------------------------------------------- */

  if (mobile) {
    const existingMobile =
      await prisma.user.findUnique({
        where: {
          mobile,
        },

        select: {
          id: true,
        },
      });

    if (existingMobile) {
      throw new Error(
        "Mobile number already registered",
      );
    }
  }

  /* -------------------------------------------------------
     PASSWORD HASH
  ------------------------------------------------------- */

  const passwordHash =
    await bcrypt.hash(
      input.password,
      12,
    );

  /* -------------------------------------------------------
     CREATE USER
  ------------------------------------------------------- */

  const user =
    await prisma.user.create({
      data: {
        name: input.name.trim(),

        email,

        mobile,

        passwordHash,

        /*
         * Public registration can ONLY create
         * normal USER accounts.
         */
        role: "USER",

        isDisabled: false,

        dateOfBirth:
          input.dateOfBirth
            ? new Date(
                `${input.dateOfBirth}T00:00:00`,
              )
            : null,

        gender:
          input.gender || null,
      },
    });

  /*
   * IMPORTANT:
   *
   * ACCOUNT_REGISTERED is now created
   * by auth.controller.ts.
   *
   * We do NOT create another audit event here.
   */

  /* -------------------------------------------------------
     AUTO LOGIN
  ------------------------------------------------------- */

  const token =
    generateToken({
      userId: user.id,
      role: user.role,
    });

  return {
    token,

    user: {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      role: user.role,
      permissions: [],
    },
  };
};