import bcrypt from "bcryptjs";

import prisma from "../db/prisma";

import { generateToken } from "../config/jwt";

import type { LoginInput } from "../validators/auth.validator";

import type { RegisterInput } from "../validators/register.validator";

import { createAuditLog } from "./audit.service";

/* =========================================================
   LOGIN
========================================================= */

/* =========================================================
   LOGIN
========================================================= */

export const loginUser = async (input: LoginInput) => {
  const identifier = input.identifier.trim();

  if (!identifier) {
    throw new Error("Invalid email or password");
  }

  /*
   * Determine whether the user entered an email or mobile.
   *
   * Mobile is normalized to digits only.
   */

  const normalizedMobile = identifier.replace(/\D/g, "");
  const isEmail = identifier.includes("@");

  const user = isEmail
    ? await prisma.user.findUnique({
        where: {
          email: identifier.toLowerCase(),
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
    throw new Error("Invalid email or password");
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
    throw new Error("Account is disabled");
  }

  /* -------------------------------------------------------
     PASSWORD
  ------------------------------------------------------- */

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  /* =======================================================
     ROLE PERMISSIONS
  ======================================================= */

  const userRoles = await prisma.userRole.findMany({
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

  /*
   * Start with permissions provided by the user's
   * assigned role(s).
   */

  const effectivePermissions = new Set<string>(
    userRoles.flatMap((userRole) =>
      userRole.role.permissions.map(
        (rolePermission) =>
          rolePermission.permission.name,
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

    for (const permission of allPermissions) {
      effectivePermissions.add(permission.name);
    }
  } else {
    /*
     * Apply individual user permission overrides.
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

    for (const override of userOverrides) {
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

  const permissions = Array.from(
    effectivePermissions,
  );

  /* =======================================================
     TOKEN
  ======================================================= */

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  /* =======================================================
     AUDIT — USER LOGIN
  ======================================================= */

  await createAuditLog({
    actorUserId: user.id,
    targetUserId: user.id,
    action: "USER_LOGIN",
    metadata: {
      method: "password",
      identifierType: isEmail
        ? "email"
        : "mobile",
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    },
  });

  /* =======================================================
     RESPONSE
  ======================================================= */

  return {
    token,
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
    ? input.email.trim().toLowerCase()
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

  const passwordHash = await bcrypt.hash(
    input.password,
    12,
  );

  /* -------------------------------------------------------
     CREATE USER
  ------------------------------------------------------- */

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      mobile,
      passwordHash,

      /*
       * Public registration can ONLY create
       * normal USER accounts.
       *
       * Never accept role from frontend.
       */
      role: "USER",
      isDisabled: false,

      /*
       * DOB
       */
      dateOfBirth: input.dateOfBirth
        ? new Date(
            `${input.dateOfBirth}T00:00:00`,
          )
        : null,

      /*
       * Gender
       */
      gender: input.gender || null,
    },
  });

  /* -------------------------------------------------------
     AUDIT — USER REGISTERED
  ------------------------------------------------------- */

  await createAuditLog({
    actorUserId: user.id,
    targetUserId: user.id,
    action: "USER_REGISTERED",
    metadata: {
      method: "password",
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    },
  });

  /* -------------------------------------------------------
     AUTO LOGIN
     
     User is automatically logged in after registration,
     but this is NOT recorded as USER_LOGIN.
  ------------------------------------------------------- */

  const token = generateToken({
    userId: user.id,
    role: user.role,
  });

  /* -------------------------------------------------------
     RESPONSE
  ------------------------------------------------------- */

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