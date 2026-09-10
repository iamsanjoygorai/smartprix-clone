import { Request, Response } from "express";
import prisma from "../db/prisma";
import bcrypt from "bcryptjs";

import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/user.validator";

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

    if (!req.user || typeof req.user === "string") {
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
       VALIDATE REQUEST
    ------------------------------------------------------- */

    const result = updateProfileSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid profile data",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      name,
      email,
      mobile,
      dateOfBirth,
      gender,
    } = result.data;

    /* -------------------------------------------------------
       CHECK CURRENT USER
    ------------------------------------------------------- */

    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        isDisabled: true,
      },
    });

    if (!currentUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (currentUser.isDisabled) {
      res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
      return;
    }

    /* -------------------------------------------------------
       CHECK DUPLICATE EMAIL
    ------------------------------------------------------- */

    const duplicateEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateEmail) {
      res.status(409).json({
        success: false,
        message: "Email already registered",
      });
      return;
    }

    /* -------------------------------------------------------
       CHECK DUPLICATE MOBILE
    ------------------------------------------------------- */

    const duplicateMobile = await prisma.user.findFirst({
      where: {
        mobile,
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateMobile) {
      res.status(409).json({
        success: false,
        message: "Mobile number already registered",
      });
      return;
    }

    /* -------------------------------------------------------
       VALIDATE DATE OF BIRTH
    ------------------------------------------------------- */

    const parsedDate = new Date(
      `${dateOfBirth}T00:00:00`,
    );

    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid date of birth",
      });
      return;
    }

    /* -------------------------------------------------------
       UPDATE PROFILE
    ------------------------------------------------------- */

    const user = await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        name,
        email,
        mobile,
        dateOfBirth: parsedDate,
        gender,
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
      "Update profile failed:",
      error,
    );

    /* Prisma unique constraint fallback */
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        success: false,
        message:
          "Email or mobile number is already registered",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

/* =========================================================
   GET PROFILE
========================================================= */

export const getProfile = async (
  req: Request,
  res: Response,
) => {
  try {
    /* -------------------------------------------------------
       AUTHENTICATION
    ------------------------------------------------------- */

    if (!req.user || typeof req.user === "string") {
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
       FETCH USER + REAL STATISTICS
    ------------------------------------------------------- */

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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

        _count: {
          select: {
            reviews: true,
            favorites: true,
            comparisons: true,
            priceAlerts: true,
          },
        },
      },
    });

    /* -------------------------------------------------------
       USER NOT FOUND
    ------------------------------------------------------- */

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
      res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
      return;
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
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        role: user.role,
        isDisabled: user.isDisabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,

        stats: {
          reviews: user._count.reviews,
          favorites: user._count.favorites,
          comparisons: user._count.comparisons,
          priceAlerts: user._count.priceAlerts,
        },
      },
    });
  } catch (error) {
    console.error(
      "Get profile failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */

export const changePassword = async (
  req: Request,
  res: Response,
) => {
  try {
    /* -------------------------------------------------------
       AUTHENTICATION
    ------------------------------------------------------- */

    if (!req.user || typeof req.user === "string") {
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
       VALIDATE REQUEST
    ------------------------------------------------------- */

    const result =
      changePasswordSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid password data",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      currentPassword,
      newPassword,
    } = result.data;

    /* -------------------------------------------------------
       FETCH USER
    ------------------------------------------------------- */

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        passwordHash: true,
        isDisabled: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.isDisabled) {
      res.status(403).json({
        success: false,
        message: "Account is disabled",
      });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({
        success: false,
        message:
          "Password change is not available for this account",
      });
      return;
    }

    /* -------------------------------------------------------
       VERIFY CURRENT PASSWORD
    ------------------------------------------------------- */

    const currentPasswordMatches =
      await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

    if (!currentPasswordMatches) {
      res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
      return;
    }

    /* -------------------------------------------------------
       PREVENT SAME PASSWORD
    ------------------------------------------------------- */

    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.passwordHash,
      );

    if (samePassword) {
      res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password",
      });
      return;
    }

    /* -------------------------------------------------------
       HASH NEW PASSWORD
    ------------------------------------------------------- */

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12,
      );

    /* -------------------------------------------------------
       SAVE PASSWORD
    ------------------------------------------------------- */

    await prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        passwordHash,

        // Invalidate any existing
        // password reset link.
        resetPasswordTokenHash: null,
        resetPasswordExpiresAt: null,
      },
    });

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "Change password failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};