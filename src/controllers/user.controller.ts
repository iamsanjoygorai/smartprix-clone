import { Request, Response } from "express";

import prisma from "../db/prisma";

import bcrypt from "bcryptjs";

import fs from "fs";

import path from "path";

import {

  updateProfileSchema,

  changePasswordSchema,

} from "../validators/user.validator";

import {

  getUsers,

  getUserById,

  updateUser,

  setUserDisabledStatus,

  deleteUser,

} from "../services/user.service";

import { createAuditLog } from "../services/audit.service";

import {

  AUDIT_ACTIONS,

  AUDIT_CATEGORIES,

} from "../modules/audit/audit.constants";

import { buildAuditChanges } from "../modules/audit/audit-change";

import { getAuditRequestContext } from "../modules/audit/audit.context";

import historyService from "../modules/history/history.service";

import {

  HISTORY_CATEGORY,

  HISTORY_EVENTS,

  HISTORY_OPERATION,

} from "../modules/history/history.constants";

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

  where: { id: userId },

 select: {
  id: true,
  name: true,
  email: true,
  mobile: true,
  isDisabled: true,
  dateOfBirth: true,
  gender: true,
  profileImageUrl: true,
}

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

/* -------------------------------------------------------

   VALIDATE DATE OF BIRTH

------------------------------------------------------- */

let parsedDate: Date | null = null;

if (dateOfBirth) {

  parsedDate = new Date(

    `${dateOfBirth}T00:00:00`,

  );

  if (Number.isNaN(parsedDate.getTime())) {

    res.status(400).json({

      success: false,

      message: "Invalid date of birth",

    });

    return;

  }

}

/* -------------------------------------------------------

   VALIDATE DATE OF BIRTH

------------------------------------------------------- */

if (dateOfBirth) {

  parsedDate = new Date(

    `${dateOfBirth}T00:00:00`,

  );

  if (Number.isNaN(parsedDate.getTime())) {

    res.status(400).json({

      success: false,

      message: "Invalid date of birth",

    });

    return;

  }

}

/* -------------------------------------------------------

   CURRENT DATE OF BIRTH

------------------------------------------------------- */

const currentDob = currentUser.dateOfBirth

  ? currentUser.dateOfBirth.toISOString().slice(0, 10)

  : null;

/* -------------------------------------------------------

   UPDATE USER

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
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
},

});

/* -------------------------------------------------------

   ACTUAL DATABASE DATE

------------------------------------------------------- */

const updatedDob = user.dateOfBirth

  ? user.dateOfBirth.toISOString().slice(0, 10)

  : null;

/* -------------------------------------------------------

   BUILD HISTORY CHANGES

------------------------------------------------------- */

const changes = buildAuditChanges(
  {
    name: currentUser.name,
    email: currentUser.email,
    mobile: currentUser.mobile,
    dateOfBirth: currentDob,
    gender: currentUser.gender,
    profileImageUrl:
      currentUser.profileImageUrl ?? null,
  },
  {
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    dateOfBirth: updatedDob,
    gender: user.gender,
    profileImageUrl:
      user.profileImageUrl ?? null,
  },
  [
    {
      key: "name",
      label: "Name",
    },
    {
      key: "email",
      label: "Email",
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
    {
      key: "profileImageUrl",
      label: "Profile Picture",
    },
  ],
);
/* -------------------------------------------------------

   GIT-LIKE HISTORY

------------------------------------------------------- */

if (changes.length > 0) {

  const auditContext = getAuditRequestContext(req);

  console.log("========== PROFILE HISTORY DEBUG ==========");

  console.log("USER ID:", userId);

  console.log("CURRENT USER:", {

    name: currentUser.name,

    email: currentUser.email,

    mobile: currentUser.mobile,

    dateOfBirth: currentDob,

    gender: currentUser.gender,

  });

  console.log("UPDATED USER:", {

    name: user.name,

    email: user.email,

    mobile: user.mobile,

    dateOfBirth: user.dateOfBirth

      ? user.dateOfBirth.toISOString().slice(0, 10)

      : null,

    gender: user.gender,

  });

  console.log("AUDIT CHANGES:", changes);

  console.log("==========================================");

  await historyService.recordChange({

    actorUserId: auditContext.userId ?? userId,

    targetUserId: userId,

    category: HISTORY_CATEGORY.USER,

    eventType: HISTORY_EVENTS.USER_UPDATED,

    operation: HISTORY_OPERATION.UPDATE,

    entityType: "User",

    entityId: userId,

    title: "Profile updated",

    description:

      "User profile information was updated.",

    before: {

      name: currentUser.name,

      email: currentUser.email,

      mobile: currentUser.mobile,

      dateOfBirth: currentDob,

      gender: currentUser.gender,

    },

    after: {

      name: user.name,

      email: user.email,

      mobile: user.mobile,

      dateOfBirth: user.dateOfBirth

        ? user.dateOfBirth.toISOString().slice(0, 10)

        : null,

      gender: user.gender,

    },

    metadata: {

      changes,

    },

    createSnapshot: true,

  });

}

    if (changes.length > 0) {

  const auditContext = getAuditRequestContext(req);

await createAuditLog({

  actorUserId: auditContext.userId,

  targetUserId: userId,

  action: AUDIT_ACTIONS.PROFILE_UPDATED,

  metadata: {

    changes,

  },

});

}

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
  role: true,
  isDisabled: true,
  dateOfBirth: true,
  gender: true,
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
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

  profileImageUrl: user.profileImageUrl,

  dateOfBirth: user.dateOfBirth,

  gender: user.gender,

  role: user.role,

  isDisabled: user.isDisabled,

  createdAt: user.createdAt,

  updatedAt: user.updatedAt,
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

   UPLOAD / REPLACE PROFILE IMAGE

========================================================= */

export const uploadProfileImage = async (

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

       CHECK FILE

    ------------------------------------------------------- */

    if (!req.file) {

      res.status(400).json({

        success: false,

        message: "Please select a profile picture",

      });

      return;

    }

    /* -------------------------------------------------------

       CHECK USER

    ------------------------------------------------------- */

    const currentUser = await prisma.user.findUnique({

      where: {

        id: userId,

      },

      select: {

        id: true,

        isDisabled: true,

        profileImageUrl: true,

      },

    });

    if (!currentUser) {

      // Remove newly uploaded file if user doesn't exist.

      if (req.file.path) {

        try {

          await fs.promises.unlink(req.file.path);

        } catch {

          // Ignore cleanup error.

        }

      }

      res.status(404).json({

        success: false,

        message: "User not found",

      });

      return;

    }

    if (currentUser.isDisabled) {

      if (req.file.path) {

        try {

          await fs.promises.unlink(req.file.path);

        } catch {

          // Ignore cleanup error.

        }

      }

      res.status(403).json({

        success: false,

        message: "Account is disabled",

      });

      return;

    }

    /* -------------------------------------------------------

       BUILD PUBLIC IMAGE URL

    ------------------------------------------------------- */

    const relativePath = `/uploads/profile/${req.file.filename}`;

    const protocol =

      req.headers["x-forwarded-proto"] ||

      req.protocol;

    const host = req.get("host");

    const profileImageUrl =

      `${protocol}://${host}${relativePath}`;

    /* -------------------------------------------------------

       UPDATE DATABASE

    ------------------------------------------------------- */

    const updatedUser = await prisma.user.update({

      where: {

        id: userId,

      },

      data: {

        profileImageUrl,

      },

      select: {

        id: true,

        name: true,

        email: true,

        mobile: true,

        profileImageUrl: true,

        dateOfBirth: true,

        gender: true,

        role: true,

        isDisabled: true,

        createdAt: true,

        updatedAt: true,

      },

    });

    /* -------------------------------------------------------

       DELETE OLD IMAGE

    ------------------------------------------------------- */

    if (

      currentUser.profileImageUrl &&

      currentUser.profileImageUrl.includes(

        "/uploads/profile/",

      )

    ) {

      try {

        const oldUrl = new URL(

          currentUser.profileImageUrl,

        );

        const oldFilePath = path.join(

          process.cwd(),

          oldUrl.pathname.replace(/^\/+/, ""),

        );

        if (

          fs.existsSync(oldFilePath) &&

          oldFilePath !== req.file.path

        ) {

          await fs.promises.unlink(oldFilePath);

        }

      } catch (cleanupError) {

        console.warn(

          "Failed to remove old profile image:",

          cleanupError,

        );

      }

    }

    /* -------------------------------------------------------

       RESPONSE

    ------------------------------------------------------- */

    res.status(200).json({

      success: true,

      message: "Profile picture updated successfully",

      data: updatedUser,

    });

  } catch (error) {

    console.error(

      "Upload profile image failed:",

      error,

    );

    /* -------------------------------------------------------

       CLEANUP NEW FILE ON FAILURE

    ------------------------------------------------------- */

    if (req.file?.path) {

      try {

        await fs.promises.unlink(req.file.path);

      } catch {

        // Ignore cleanup error.

      }

    }

    res.status(500).json({

      success: false,

      message: "Failed to update profile picture",

    });

  }

};

/* =========================================================

   DELETE PROFILE IMAGE

========================================================= */

export const deleteProfileImage = async (

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

       GET CURRENT USER

    ------------------------------------------------------- */

    const currentUser = await prisma.user.findUnique({

      where: {

        id: userId,

      },

      select: {

        id: true,

        isDisabled: true,

        profileImageUrl: true,

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

       NOTHING TO DELETE

    ------------------------------------------------------- */

    if (!currentUser.profileImageUrl) {

      res.status(200).json({

        success: true,

        message: "No profile picture to remove",

      });

      return;

    }

    /* -------------------------------------------------------

       CLEAR DATABASE

    ------------------------------------------------------- */

    await prisma.user.update({

      where: {

        id: userId,

      },

      data: {

        profileImageUrl: null,

      },

    });

    /* -------------------------------------------------------

       DELETE PHYSICAL FILE

    ------------------------------------------------------- */

    if (

      currentUser.profileImageUrl.includes(

        "/uploads/profile/",

      )

    ) {

      try {

        const oldUrl = new URL(

          currentUser.profileImageUrl,

        );

        const oldFilePath = path.join(

          process.cwd(),

          oldUrl.pathname.replace(/^\/+/, ""),

        );

        if (fs.existsSync(oldFilePath)) {

          await fs.promises.unlink(oldFilePath);

        }

      } catch (cleanupError) {

        console.warn(

          "Failed to delete profile image file:",

          cleanupError,

        );

      }

    }

    /* =======================================================

       AUDIT — PROFILE IMAGE DELETED

    ======================================================= */

    await createAuditLog({

  actorUserId: userId,

  targetUserId: userId,

  action: AUDIT_ACTIONS.PROFILE_IMAGE_DELETED,

  metadata: {

    hadProfileImage: true,

    sessionId:

      typeof req.user === "object" &&

      req.user !== null &&

      "sessionId" in req.user

        ? req.user.sessionId ?? null

        : null,

    ipAddress:

      req.ip ||

      req.headers["x-forwarded-for"]

        ?.toString()

        .split(",")[0]

        ?.trim() ||

      null,

    userAgent:

      req.headers["user-agent"]?.toString() ||

      null,

  },

});

    /* -------------------------------------------------------

       RESPONSE

    ------------------------------------------------------- */

    res.status(200).json({

      success: true,

      message: "Profile picture removed successfully",

      data: {

        profileImageUrl: null,

      },

    });

  } catch (error) {

    console.error(

      "Delete profile image failed:",

      error,

    );

    res.status(500).json({

      success: false,

      message: "Failed to remove profile picture",

    });

  }

};

/* =========================================================

   SAVE PROFILE + PROFILE IMAGE TOGETHER

   ONE SAVE = ONE HISTORY EVENT

========================================================= */

export const updateCompleteProfile = async (

  req: Request,

  res: Response,

) => {

  let uploadedFilePath: string | null =

    req.file?.path ?? null;

  try {

    /* =========================================================

       AUTHENTICATION

    ========================================================= */

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

    /* =========================================================

       VALIDATE PROFILE DATA

    ========================================================= */

    const result = updateProfileSchema.safeParse(

      req.body,

    );

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

    /* =========================================================

       GET CURRENT USER

    ========================================================= */

    const currentUser =

      await prisma.user.findUnique({

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

          profileImageUrl: true,

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

    /* =========================================================

       DUPLICATE EMAIL

    ========================================================= */

    const duplicateEmail =

      await prisma.user.findFirst({

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

    /* =========================================================

       DUPLICATE MOBILE

    ========================================================= */

    const duplicateMobile =

      await prisma.user.findFirst({

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

        message:

          "Mobile number already registered",

      });

      return;

    }

    /* =========================================================

       DATE OF BIRTH

       IMPORTANT:

       Store date-only values at UTC midnight.

    ========================================================= */

    let parsedDate: Date | null = null;

if (dateOfBirth) {
  parsedDate = new Date(
    `${dateOfBirth}T00:00:00.000Z`,
  );

  if (Number.isNaN(parsedDate.getTime())) {
    res.status(400).json({
      success: false,
      message: "Invalid date of birth",
    });
    return;
  }
}

const profileImageUrl = req.file
  ? `${req.protocol}://${req.get("host")}/uploads/profile/${req.file.filename}`
  : currentUser.profileImageUrl;

    /* =========================================================

       UPDATE USER

    ========================================================= */

    const updatedUser =

      await prisma.user.update({

        where: {

          id: userId,

        },

        data: {

          name,

          email,

          mobile,

          dateOfBirth: parsedDate,

          gender,

          profileImageUrl,

        },

        select: {

          id: true,

          name: true,

          email: true,

          mobile: true,

          profileImageUrl: true,

          dateOfBirth: true,

          gender: true,

          role: true,

          isDisabled: true,

          createdAt: true,

          updatedAt: true,

        },

      });

    /* =========================================================

       FORMAT DATE-ONLY VALUES

    ========================================================= */

    const formatDateOnly = (

      value:

        | Date

        | string

        | null

        | undefined,

    ): string | null => {

      if (!value) {

        return null;

      }

      if (typeof value === "string") {

        return value.slice(0, 10);

      }

      return value

        .toISOString()

        .slice(0, 10);

    };

    /* =========================================================

       BEFORE / AFTER

    ========================================================= */

    const before = {

      name: currentUser.name,

      email: currentUser.email,

      mobile: currentUser.mobile,

      dateOfBirth:

        formatDateOnly(

          currentUser.dateOfBirth,

        ),

      gender: currentUser.gender,

      profileImageUrl:

        currentUser.profileImageUrl ?? null,

    };

    const after = {

      name: updatedUser.name,

      email: updatedUser.email,

      mobile: updatedUser.mobile,

      dateOfBirth:

        formatDateOnly(

          updatedUser.dateOfBirth,

        ),

      gender: updatedUser.gender,

      profileImageUrl:

        updatedUser.profileImageUrl ?? null,

    };

    /* =========================================================

       DEBUG

       Temporarily keep this so we can confirm image detection.

    ========================================================= */

    console.log(

      "========== COMPLETE PROFILE UPDATE ==========",

    );

    console.log("REQ FILE:", {

      exists: !!req.file,

      filename:

        req.file?.filename ?? null,

      originalname:

        req.file?.originalname ?? null,

    });

    console.log("BEFORE:", before);

    console.log("AFTER:", after);

    /* =========================================================

       BUILD ONLY REAL CHANGES

    ========================================================= */

    const changes =

      buildAuditChanges(

        before,

        after,

        [

          {

            key: "name",

            label: "Name",

          },

          {

            key: "email",

            label: "Email",

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

          {

            key: "profileImageUrl",

            label: "Profile Picture",

          },

        ],

      );

    console.log(

      "AUDIT CHANGES:",

      changes,

    );

    console.log(

      "=============================================",

    );

    /* =========================================================

       ONE HISTORY EVENT

    ========================================================= */

    if (changes.length > 0) {

      const auditContext =

        getAuditRequestContext(req);

      const actorUserId =

        auditContext.userId ?? userId;

      await historyService.recordChange({

        actorUserId,

        targetUserId: userId,

        category:

          HISTORY_CATEGORY.USER,

        eventType:

          HISTORY_EVENTS.USER_UPDATED,

        operation:

          HISTORY_OPERATION.UPDATE,

        entityType: "User",

        entityId: userId,

        title: "Profile Updated",

        description:

          "User profile information was updated.",

        before,

        after,

        metadata: {

          changes,

          profileImageChanged:

            before.profileImageUrl !==

            after.profileImageUrl,

        },

        createSnapshot: true,

      });

      /* =====================================================

         NORMAL AUDIT LOG

      ===================================================== */

      await createAuditLog({

        actorUserId,

        targetUserId: userId,

        action:

          AUDIT_ACTIONS.PROFILE_UPDATED,

        metadata: {

          changes,

        },

      });

    }

    /* =========================================================

       DELETE OLD IMAGE

    ========================================================= */

    if (

      req.file &&

      currentUser.profileImageUrl &&

      currentUser.profileImageUrl.includes(

        "/uploads/profile/",

      )

    ) {

      try {

        const oldUrl = new URL(

          currentUser.profileImageUrl,

        );

        const oldFilePath =

          path.join(

            process.cwd(),

            oldUrl.pathname.replace(

              /^\/+/,

              "",

            ),

          );

        if (

          fs.existsSync(oldFilePath) &&

          oldFilePath !== uploadedFilePath

        ) {

          await fs.promises.unlink(

            oldFilePath,

          );

        }

      } catch (cleanupError) {

        console.warn(

          "Failed to remove old profile image:",

          cleanupError,

        );

      }

    }

    /* =========================================================

       RESPONSE

    ========================================================= */

    res.status(200).json({

      success: true,

      message:

        "Profile updated successfully",

      data: updatedUser,

    });

  } catch (error) {

    console.error(

      "Complete profile update failed:",

      error,

    );

    /* =======================================================

       DELETE NEW FILE IF UPDATE FAILED

    ======================================================= */

    if (uploadedFilePath) {

      try {

        await fs.promises.unlink(

          uploadedFilePath,

        );

      } catch {

        // Ignore cleanup error.

      }

    }

    res.status(500).json({

      success: false,

      message:

        "Failed to update profile",

    });

  }

};

/* =========================================================

   PERMANENTLY DELETE CURRENT USER ACCOUNT

========================================================= */

export const deleteAccount = async (

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

       GET CURRENT USER

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

  role: true,

  passwordHash: true,

  isDisabled: true,

  profileImageUrl: true,

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

       CHECK ACCOUNT STATUS

    ------------------------------------------------------- */

    if (user.isDisabled) {

      res.status(403).json({

        success: false,

        message: "Account is disabled",

      });

      return;

    }

    /* -------------------------------------------------------

       PASSWORD REQUIRED

    ------------------------------------------------------- */

    const { currentPassword } = req.body ?? {};

    if (

      typeof currentPassword !== "string" ||

      !currentPassword.trim()

    ) {

      res.status(400).json({

        success: false,

        message: "Current password is required",

      });

      return;

    }

    if (!user.passwordHash) {

      res.status(400).json({

        success: false,

        message:

          "Account deletion is not available because this account does not have a password",

      });

      return;

    }

    /* -------------------------------------------------------

       VERIFY PASSWORD

    ------------------------------------------------------- */

    const passwordMatches = await bcrypt.compare(

      currentPassword,

      user.passwordHash,

    );

    if (!passwordMatches) {

      res.status(400).json({

        success: false,

        message: "Current password is incorrect",

      });

      return;

    }

    /* -------------------------------------------------------

       DELETE PROFILE IMAGE FILE

       Do this before deleting the database record so we

       still have access to the image URL.

    ------------------------------------------------------- */

    if (

      user.profileImageUrl &&

      user.profileImageUrl.includes(

        "/uploads/profile/",

      )

    ) {

      try {

        const imageUrl = new URL(

          user.profileImageUrl,

        );

        const imagePath = path.join(

          process.cwd(),

          imageUrl.pathname.replace(/^\/+/, ""),

        );

        if (fs.existsSync(imagePath)) {

          await fs.promises.unlink(imagePath);

        }

      } catch (cleanupError) {

        console.warn(

          "Failed to delete profile image during account deletion:",

          cleanupError,

        );

      }

    }

    await createAuditLog({

  actorUserId: userId,

  targetUserId: userId,

  action: "USER_DELETED",

  metadata: {

    deletedUserId: user.id,

    name: user.name,

    email: user.email,

    mobile: user.mobile,

    role: user.role,

    reason: "User permanently deleted account",

  },

});

    /* -------------------------------------------------------

       PERMANENTLY DELETE USER

       Prisma onDelete: Cascade will remove:

       - Reviews

       - Comparisons

       - Favorites

       - Price alerts

       - User roles

       - User permissions

       AuditLog actor relation uses SetNull, so existing

       audit records will not prevent account deletion.

    ------------------------------------------------------- */

    await prisma.user.delete({

      where: {

        id: userId,

      },

    });

    /* -------------------------------------------------------

       RESPONSE

    ------------------------------------------------------- */

    res.status(200).json({

      success: true,

      message: "Account permanently deleted",

    });

  } catch (error) {

    console.error(

      "Delete account failed:",

      error,

    );

    /* -------------------------------------------------------

       HANDLE FOREIGN KEY / RELATION PROBLEMS

    ------------------------------------------------------- */

    if (

      error &&

      typeof error === "object" &&

      "code" in error &&

      error.code === "P2003"

    ) {

      res.status(409).json({

        success: false,

        message:

          "This account cannot be deleted because related records still exist",

      });

      return;

    }

    res.status(500).json({

      success: false,

      message: "Failed to delete account",

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

   await createAuditLog({

  actorUserId: userId,

  targetUserId: userId,

  action: AUDIT_ACTIONS.PASSWORD_CHANGED,

  metadata: {

    method: "current_password",

    sessionId:

      typeof req.user === "object" &&

      req.user !== null &&

      "sessionId" in req.user

        ? req.user.sessionId ?? null

        : null,

    ipAddress:

      req.ip ||

      req.headers["x-forwarded-for"]

        ?.toString()

        .split(",")[0]

        ?.trim() ||

      null,

    userAgent:

      req.headers["user-agent"]?.toString() || null,

  },

});

/* =======================================================

   HISTORY — PASSWORD CHANGED

======================================================= */

await historyService.record({

  actorUserId: userId,

  targetUserId: userId,

  category: HISTORY_CATEGORY.SECURITY,

  eventType: HISTORY_EVENTS.PASSWORD_CHANGED,

  operation: HISTORY_OPERATION.PASSWORD_CHANGE,

  entityType: "User",

  entityId: userId,

  title: "Password changed",

  description:

    "User changed their password using the current password.",

  sessionId:

    typeof req.user === "object" &&

    req.user !== null &&

    "sessionId" in req.user &&

    typeof req.user.sessionId === "string"

      ? req.user.sessionId

      : null,

  ipAddress:

    req.ip ||

    req.headers["x-forwarded-for"]

      ?.toString()

      .split(",")[0]

      ?.trim() ||

    null,

  userAgent:

    req.headers["user-agent"]?.toString() || null,

  metadata: {

    method: "current_password",

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

/* =========================================================

   ADMIN AUTH HELPER

========================================================= */

const getAuthenticatedUserId = (

  req: Request,

  res: Response,

): string | null => {

  if (!req.user || typeof req.user === "string") {

    res.status(401).json({

      success: false,

      message: "Authentication required",

    });

    return null;

  }

  const userId = req.user.userId;

  if (!userId) {

    res.status(401).json({

      success: false,

      message: "Invalid authentication token",

    });

    return null;

  }

  return userId;

};

/* =========================================================

   ADMIN — LIST USERS

========================================================= */

export const getAdminUsers = async (

  req: Request,

  res: Response,

) => {

  console.log("🔥🔥🔥 GET ADMIN USERS CONTROLLER HIT 🔥🔥🔥");

  console.log("QUERY RECEIVED:", req.query);

  try {

    const users = await getUsers(req.query);

    return res.status(200).json({

      success: true,

      data: users,

    });

  } catch (error) {

    console.error("GET ADMIN USERS ERROR:", error);

    return res.status(500).json({

      success: false,

      message:

        error instanceof Error

          ? error.message

          : "Failed to fetch users",

    });

  }

};

/* =========================================================

   ADMIN — GET SINGLE USER

========================================================= */

export const getAdminUser = async (

  req: Request,

  res: Response,

) => {

  try {

    const authenticatedUserId =

      getAuthenticatedUserId(req, res);

    if (!authenticatedUserId) {

      return;

    }

    const userId = Array.isArray(req.params.id)

      ? req.params.id[0]

      : req.params.id;

    if (!userId) {

      res.status(400).json({

        success: false,

        message: "User ID is required",

      });

      return;

    }

    const user = await getUserById(userId);

    res.status(200).json({

      success: true,

      data: user,

    });

  } catch (error) {

    console.error(

      "Failed to fetch admin user:",

      error,

    );

    if (

      error instanceof Error &&

      error.message === "User not found"

    ) {

      res.status(404).json({

        success: false,

        message: "User not found",

      });

      return;

    }

    res.status(500).json({

      success: false,

      message: "Failed to fetch user",

    });

  }

};

/* =========================================================

   ADMIN — UPDATE USER

========================================================= */

export const updateAdminUser = async (

  req: Request,

  res: Response,

) => {

  try {

    const actorUserId =

      getAuthenticatedUserId(req, res);

    if (!actorUserId) {

      return;

    }

    const userId = Array.isArray(req.params.id)

      ? req.params.id[0]

      : req.params.id;

    if (!userId) {

      res.status(400).json({

        success: false,

        message: "User ID is required",

      });

      return;

    }

    const {

      name,

      email,

      mobile,

      dateOfBirth,

      gender,

    } = req.body ?? {};

    const user = await updateUser(

      actorUserId,

      userId,

      {

        name,

        email,

        mobile,

        dateOfBirth,

        gender,

      },

    );

    res.status(200).json({

      success: true,

      message: "User updated successfully",

      data: user,

    });

  } catch (error) {

    console.error(

      "Failed to update admin user:",

      error,

    );

    if (error instanceof Error) {

      const knownMessages = [

        "User not found",

        "Acting user not found",

        "SUPER_ADMIN accounts cannot be modified",

        "Email or mobile number is already in use",

        "Invalid date of birth",

      ];

      if (

        knownMessages.includes(error.message)

      ) {

        res.status(

          error.message === "User not found"

            ? 404

            : 400,

        ).json({

          success: false,

          message: error.message,

        });

        return;

      }

    }

    res.status(500).json({

      success: false,

      message: "Failed to update user",

    });

  }

};

/* =========================================================

   ADMIN — ENABLE / DISABLE USER

========================================================= */

export const updateAdminUserStatus = async (

  req: Request,

  res: Response,

) => {

  try {

    const actorUserId =

      getAuthenticatedUserId(req, res);

    if (!actorUserId) {

      return;

    }

    const userId = Array.isArray(req.params.id)

      ? req.params.id[0]

      : req.params.id;

    if (!userId) {

      res.status(400).json({

        success: false,

        message: "User ID is required",

      });

      return;

    }

    if (

      typeof req.body?.disabled !== "boolean"

    ) {

      res.status(400).json({

        success: false,

        message:

          "The disabled field must be a boolean",

      });

      return;

    }

    const user =

      await setUserDisabledStatus(

        actorUserId,

        userId,

        req.body.disabled,

      );

    res.status(200).json({

      success: true,

      message: req.body.disabled

        ? "User disabled successfully"

        : "User enabled successfully",

      data: user,

    });

  } catch (error) {

    console.error(

      "Failed to update user status:",

      error,

    );

    if (error instanceof Error) {

      const knownMessages = [

        "User not found",

        "Acting user not found",

        "You cannot disable your own account",

        "SUPER_ADMIN accounts cannot be disabled",

        "SUPER_ADMIN accounts cannot be modified",

      ];

      if (

        knownMessages.includes(error.message)

      ) {

        res.status(

          error.message === "User not found"

            ? 404

            : 400,

        ).json({

          success: false,

          message: error.message,

        });

        return;

      }

    }

    res.status(500).json({

      success: false,

      message: "Failed to update user status",

    });

  }

};

/* =========================================================

   ADMIN — DELETE USER

========================================================= */

export const deleteAdminUser = async (

  req: Request,

  res: Response,

) => {

  try {

    const actorUserId =

      getAuthenticatedUserId(req, res);

    if (!actorUserId) {

      return;

    }

    const userId = Array.isArray(req.params.id)

      ? req.params.id[0]

      : req.params.id;

    if (!userId) {

      res.status(400).json({

        success: false,

        message: "User ID is required",

      });

      return;

    }

    const result = await deleteUser(

      actorUserId,

      userId,

    );

    res.status(200).json(result);

  } catch (error) {

    console.error(

      "Failed to delete admin user:",

      error,

    );

    if (error instanceof Error) {

      const knownMessages = [

        "Acting user not found",

        "User not found",

        "Only SUPER_ADMIN can delete users",

        "You cannot delete your own account",

        "SUPER_ADMIN accounts cannot be deleted",

        "This user cannot be deleted because related records still exist",

      ];

      if (

        knownMessages.includes(error.message)

      ) {

        let statusCode = 400;

        if (

          error.message === "User not found" ||

          error.message === "Acting user not found"

        ) {

          statusCode = 404;

        }

        if (

          error.message ===

          "This user cannot be deleted because related records still exist"

        ) {

          statusCode = 409;

        }

        res.status(statusCode).json({

          success: false,

          message: error.message,

        });

        return;

      }

    }

    res.status(500).json({

      success: false,

      message: "Failed to delete user",

    });

  }

};