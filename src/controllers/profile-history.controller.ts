import { Request, Response } from "express";
import prisma from "../db/prisma";

 /*

# GET MY PROFILE HISTORY

Returns activity history for the currently authenticated
user.

JWT payload contains:
req.user.userId
===============

*/

export const getMyProfileHistory = async (
req: Request,
res: Response,
) => {
try {
// =====================================================
// GET LOGGED-IN USER ID
// =====================================================

 
const userId = (req as any).user?.userId;

if (!userId) {
  res.status(401).json({
    success: false,
    message: "Authentication required",
  });
  return;
}

// =====================================================
// GET CURRENT USER
// =====================================================

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
    profileImageUrl: true,
    createdAt: true,
    updatedAt: true,
  },
});

if (!user) {
  res.status(404).json({
    success: false,
    message: "User not found",
  });
  return;
}

// =====================================================
// GET AUDIT HISTORY
// =====================================================

const logs = await prisma.auditLog.findMany({
  where: {
    OR: [
      {
        actorUserId: userId,
      },
      {
        targetUserId: userId,
      },
    ],
  },

  orderBy: {
    createdAt: "desc",
  },

  select: {
    id: true,
    actorUserId: true,
    targetUserId: true,
    action: true,
    metadata: true,
    createdAt: true,

    actor: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImageUrl: true,
      },
    },
  },
});

// =====================================================
// STATISTICS
// =====================================================

const stats = {
  total: logs.length,

  registered: logs.filter(
    (log) =>
      log.action === "USER_REGISTERED",
  ).length,

  logins: logs.filter(
    (log) =>
      log.action === "USER_LOGIN",
  ).length,

  logouts: logs.filter(
    (log) =>
      log.action === "USER_LOGOUT",
  ).length,

  profileUpdates: logs.filter(
    (log) =>
      log.action === "PROFILE_UPDATED",
  ).length,

  profileImageUpdates: logs.filter(
    (log) =>
      log.action === "PROFILE_IMAGE_UPDATED",
  ).length,

  profileImageDeletes: logs.filter(
    (log) =>
      log.action === "PROFILE_IMAGE_DELETED",
  ).length,

  deleted: logs.filter(
    (log) =>
      log.action === "USER_DELETED",
  ).length,

  adminActions: logs.filter(
    (log) =>
      log.targetUserId === userId &&
      log.actorUserId !== userId,
  ).length,
};

// =====================================================
// RESPONSE
// =====================================================

res.status(200).json({
  success: true,

  data: {
    user,
    logs,
    stats,
  },
});
 

} catch (error) {
console.error(
"Get my profile history failed:",
error,
);

 
res.status(500).json({
  success: false,
  message: "Failed to load profile history",
});
 

}
};
