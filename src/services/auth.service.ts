import bcrypt from "bcryptjs";

import prisma from "../db/prisma";

import { generateToken } from "../config/jwt";

import type { LoginInput } from "../validators/auth.validator";

import type { RegisterInput } from "../validators/register.validator";

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
     *
     * allowed = true
     *   → add permission
     *
     * allowed = false
     *   → remove permission
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
    .trim()
    .toLowerCase();

  const mobile = input.mobile.replace(/\D/g, "");

  /* -------------------------------------------------------
     DUPLICATE EMAIL / MOBILE
  ------------------------------------------------------- */

  const existingUser =
    await prisma.user.findFirst({
      where: {
        OR: [
          {
            email,
          },
          {
            mobile,
          },
        ],
      },
      select: {
        email: true,
        mobile: true,
      },
    });

  if (existingUser?.email === email) {
    throw new Error(
      "Email already registered",
    );
  }

  if (existingUser?.mobile === mobile) {
    throw new Error(
      "Mobile number already registered",
    );
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
       * Public registration can ONLY create USER accounts.
       *
       * Never accept role from the frontend.
       */
      role: "USER",

      isDisabled: false,

      /*
       * DOB and gender are now actually persisted.
       */
      dateOfBirth: new Date(
        `${input.dateOfBirth}T00:00:00`,
      ),

      gender: input.gender,
    },
  });

  /* -------------------------------------------------------
     AUTO LOGIN
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