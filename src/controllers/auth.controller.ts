import { Request, Response } from "express";

import { loginSchema } from "../validators/auth.validator";

import {
  loginUser,
  registerUser,
  loginWithFirebase,
} from "../services/auth.service";


import { registerSchema } from "../validators/register.validator";

import prisma from "../db/prisma";
import { createAuditLog } from "../services/audit.service";

/* =========================================================
   LOGIN
========================================================= */

export const login = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = loginSchema.safeParse(
      req.body,
    );

    if (!result.success) {
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
    );

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
   LOGOUT
========================================================= */



/* =========================================================
   FIREBASE LOGIN
========================================================= */

export const firebaseLogin = async (
  req: Request,
  res: Response,
) => {
  try {
    const { idToken } = req.body;

    if (
      typeof idToken !== "string" ||
      !idToken.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Firebase ID token is required",
      });
      return;
    }

    const data = await loginWithFirebase(
      idToken,
    );

    res.status(200).json({
      success: true,
      message: "Firebase login successful",
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
      message: "Firebase authentication failed",
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

    const data = await registerUser(
      result.data,
    );

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

    const userId = req.user.userId;

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

      for (const permission of allPermissions) {
        effectivePermissions.add(
          permission.name,
        );
      }
    } else {
      /* -----------------------------------------------------
         INDIVIDUAL PERMISSION OVERRIDES
      ----------------------------------------------------- */

      for (const override of
        user.userPermissions) {
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
        profileImageUrl: user.profileImageUrl,

        dateOfBirth:
          user.dateOfBirth,

        gender: user.gender,

        role: user.role,

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
        message: "Authentication required",
      });
      return;
    }

    const userId = req.user.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
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
        message: "Invalid mobile number",
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
          message: "Invalid date of birth",
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
          message: "Invalid date of birth",
        });
        return;
      }

      parsedDateOfBirth = parsedDate;
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
          createdAt: true,
          updatedAt: true,
        },
      });

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
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
    if (
      !req.user ||
      typeof req.user === "string"
    ) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userId = req.user.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    await createAuditLog({
  actorUserId: userId,
  targetUserId: userId,
  action: "USER_LOGOUT",
  metadata: {
    method: "manual",
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