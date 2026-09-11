import { Prisma } from "@prisma/client";

import prisma from "../db/prisma";

/* =========================================================
   TYPES
========================================================= */

interface UserListQuery {
  page?: string | string[];
  limit?: string | string[];
  search?: string | string[];
  role?: string | string[];
  status?: string | string[];
  sort?: string | string[];
}

interface UpdateUserInput {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
}

/* =========================================================
   HELPERS
========================================================= */

const getQueryString = (
  value: string | string[] | undefined,
): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const parsePositiveInt = (
  value: string | string[] | undefined,
  fallback: number,
  max?: number,
): number => {
  const parsed = Number(getQueryString(value));

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  const integer = Math.floor(parsed);

  if (max !== undefined) {
    return Math.min(integer, max);
  }

  return integer;
};

const normalizeNullableString = (
  value: string | null | undefined,
): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
};

const parseDateOfBirth = (
  value: string | null | undefined,
): Date | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value.trim() === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date of birth");
  }

  return date;
};

/* =========================================================
   SAFE USER SELECT
   NEVER RETURN PASSWORD / RESET TOKENS
========================================================= */

const safeUserSelect = {
  id: true,
  email: true,
  mobile: true,
  name: true,
  role: true,
  isDisabled: true,
  dateOfBirth: true,
  gender: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/* =========================================================
   GET USERS
========================================================= */

export const getUsers = async (
  query: UserListQuery = {},
) => {
  console.log("🔥🔥🔥 NEW getUsers() CODE IS RUNNING 🔥🔥🔥");
  console.log("🔥 QUERY RECEIVED:", query);
  const page = parsePositiveInt(query.page, 1);

  const limit = parsePositiveInt(
    query.limit,
    20,
    100,
  );

  const search = getQueryString(query.search).trim();

  const role = getQueryString(query.role)
    .trim()
    .toUpperCase();

  const status = getQueryString(query.status)
    .trim()
    .toLowerCase();

  const sort = getQueryString(query.sort)
    .trim()
    .toLowerCase();

  const where: Prisma.UserWhereInput = {};

  /* =========================================================
     SEARCH
  ========================================================= */

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        mobile: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  /* =========================================================
     ROLE FILTER
  ========================================================= */

  if (role && role !== "ALL") {
    where.role = role;
  }

  /* =========================================================
     STATUS FILTER
  ========================================================= */

  if (status === "active") {
    where.isDisabled = false;
  }

  if (status === "disabled") {
    where.isDisabled = true;
  }

  /* =========================================================
     SORT
  ========================================================= */

  let orderBy: Prisma.UserOrderByWithRelationInput = {
    createdAt: "desc",
  };

  switch (sort) {
    case "oldest":
      orderBy = {
        createdAt: "asc",
      };
      break;

    case "name-asc":
      orderBy = {
        name: "asc",
      };
      break;

    case "name-desc":
      orderBy = {
        name: "desc",
      };
      break;

    case "email-asc":
      orderBy = {
        email: "asc",
      };
      break;

    case "email-desc":
      orderBy = {
        email: "desc",
      };
      break;

    case "newest":
    default:
      orderBy = {
        createdAt: "desc",
      };
      break;
  }

  /* =========================================================
     PAGINATION
  ========================================================= */

  const skip = (page - 1) * limit;

  /* =========================================================
     DATA + FILTERED COUNT + GLOBAL STATS
  ========================================================= */

console.log("========== USER FILTER DEBUG ==========");
console.log("QUERY:", query);
console.log("SEARCH:", search);
console.log("ROLE:", role);
console.log("STATUS:", status);
console.log("SORT:", sort);
console.log("WHERE:", JSON.stringify(where, null, 2));
console.log("=======================================");

  const [
    users,
    filteredTotal,
    total,
    active,
    disabled,
    admins,
  ] = await Promise.all([
    /* -------------------------------------------------------
       FILTERED USERS
    ------------------------------------------------------- */

    

    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy,
      skip,
      take: limit,
    }),
    

    /* -------------------------------------------------------
       FILTERED TOTAL
    ------------------------------------------------------- */

    prisma.user.count({
      where,
    }),

    /* -------------------------------------------------------
       GLOBAL TOTAL
    ------------------------------------------------------- */

    prisma.user.count(),

    /* -------------------------------------------------------
       GLOBAL ACTIVE
    ------------------------------------------------------- */

    prisma.user.count({
      where: {
        isDisabled: false,
      },
    }),

    /* -------------------------------------------------------
       GLOBAL DISABLED
    ------------------------------------------------------- */

    prisma.user.count({
      where: {
        isDisabled: true,
      },
    }),

    /* -------------------------------------------------------
       GLOBAL ADMIN COUNT
    ------------------------------------------------------- */

    prisma.user.count({
      where: {
        role: {
          in: ["ADMIN", "SUPER_ADMIN"],
        },
      },
    }),
  ]);

  const totalPages =
    filteredTotal === 0
      ? 0
      : Math.ceil(filteredTotal / limit);

      console.log("FILTERED USERS COUNT:", users.length);
console.log("FILTERED TOTAL:", filteredTotal);
console.log(
  "FILTERED USER IDS:",
  users.map((user) => user.id),
);

  return {
    users,

    stats: {
      total,
      active,
      disabled,
      admins,
    },

    pagination: {
      page,
      limit,

      // Important:
      // this is the number of users matching
      // the current search/filter.
      total: filteredTotal,

      totalPages,

      hasNextPage:
        page < totalPages,

      hasPreviousPage:
        page > 1,
    },
  };
};

/* =========================================================
   GET SINGLE USER
========================================================= */

export const getUserById = async (
  userId: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: safeUserSelect,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/* =========================================================
   UPDATE USER
========================================================= */

export const updateUser = async (
  actorUserId: string,
  userId: string,
  input: UpdateUserInput,
) => {
  const actor = await prisma.user.findUnique({
    where: {
      id: actorUserId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!actor) {
    throw new Error("Acting user not found");
  }

  const existingUser = await prisma.user.findUnique({
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
    },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  /*
   * SUPER_ADMIN accounts are protected.
   *
   * They should be managed through the dedicated
   * Admin Management area instead.
   */
  if (
    existingUser.role === "SUPER_ADMIN" &&
    actor.role !== "SUPER_ADMIN"
  ) {
    throw new Error(
      "SUPER_ADMIN accounts cannot be modified",
    );
  }

  /*
   * Never allow the normal Users page to change roles.
   * Admin Management will handle administrative roles.
   */

  const data: Prisma.UserUpdateInput = {};

  if (input.name !== undefined) {
    data.name =
      normalizeNullableString(input.name);
  }

  if (input.email !== undefined) {
    data.email =
      normalizeNullableString(input.email);
  }

  if (input.mobile !== undefined) {
    data.mobile =
      normalizeNullableString(input.mobile);
  }

  if (input.gender !== undefined) {
    data.gender =
      normalizeNullableString(input.gender);
  }

  if (input.dateOfBirth !== undefined) {
    data.dateOfBirth =
      parseDateOfBirth(input.dateOfBirth);
  }

  if (Object.keys(data).length === 0) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: safeUserSelect,
    });
  }

  try {
    const updatedUser =
      await prisma.user.update({
        where: {
          id: userId,
        },
        data,
        select: safeUserSelect,
      });

    await prisma.auditLog.create({
      data: {
        actorUserId,
        targetUserId: userId,
        action: "USER_UPDATED",
        metadata: {
          changedFields: Object.keys(data),
        },
      },
    });

    return updatedUser;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error(
        "Email or mobile number is already in use",
      );
    }

    throw error;
  }
};

/* =========================================================
   ENABLE / DISABLE USER
========================================================= */

export const setUserDisabledStatus = async (
  actorUserId: string,
  userId: string,
  disabled: boolean,
) => {
  const actor = await prisma.user.findUnique({
    where: {
      id: actorUserId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!actor) {
    throw new Error("Acting user not found");
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      isDisabled: true,
    },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  /*
   * Never allow an administrator to disable themselves.
   * This prevents accidental lockout.
   */
  if (actorUserId === userId) {
    throw new Error(
      "You cannot disable your own account",
    );
  }

  /*
   * SUPER_ADMIN accounts are protected.
   */
  if (targetUser.role === "SUPER_ADMIN") {
    throw new Error(
      "SUPER_ADMIN accounts cannot be disabled",
    );
  }

  /*
   * Only SUPER_ADMIN can modify another SUPER_ADMIN.
   * This check also keeps the protection explicit.
   */
  if (
    targetUser.role === "SUPER_ADMIN" &&
    actor.role !== "SUPER_ADMIN"
  ) {
    throw new Error(
      "SUPER_ADMIN accounts cannot be modified",
    );
  }

  if (
    targetUser.isDisabled === disabled
  ) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: safeUserSelect,
    });
  }

  const updatedUser =
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isDisabled: disabled,
      },
      select: safeUserSelect,
    });

  await prisma.auditLog.create({
    data: {
      actorUserId,
      targetUserId: userId,
      action: disabled
        ? "USER_DISABLED"
        : "USER_ENABLED",
      metadata: {
        previousStatus:
          targetUser.isDisabled
            ? "disabled"
            : "active",
        newStatus: disabled
          ? "disabled"
          : "active",
      },
    },
  });

  return updatedUser;
};

/* =========================================================
   DELETE USER
========================================================= */

export const deleteUser = async (
  actorUserId: string,
  userId: string,
) => {
  const actor = await prisma.user.findUnique({
    where: {
      id: actorUserId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!actor) {
    throw new Error("Acting user not found");
  }

  /*
   * Only SUPER_ADMIN has USERS_DELETE permission,
   * but we enforce the rule here too so the service
   * cannot be accidentally reused insecurely.
   */
  if (actor.role !== "SUPER_ADMIN") {
    throw new Error(
      "Only SUPER_ADMIN can delete users",
    );
  }

  /*
   * Prevent deleting yourself.
   */
  if (actorUserId === userId) {
    throw new Error(
      "You cannot delete your own account",
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      mobile: true,
      name: true,
      role: true,
      isDisabled: true,
    },
  });

  if (!targetUser) {
    throw new Error("User not found");
  }

  /*
   * SUPER_ADMIN accounts are never deleted from
   * the normal Users management flow.
   */
  if (targetUser.role === "SUPER_ADMIN") {
    throw new Error(
      "SUPER_ADMIN accounts cannot be deleted",
    );
  }

  /*
   * Create the audit record BEFORE deleting the user.
   *
   * targetUserId is not a foreign-key relation in the
   * AuditLog model, so the record survives deletion.
   */
  await prisma.auditLog.create({
    data: {
      actorUserId,
      targetUserId: userId,
      action: "USER_DELETED",
      metadata: {
        deletedUser: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          mobile: targetUser.mobile,
          role: targetUser.role,
          isDisabled: targetUser.isDisabled,
        },
      },
    },
  });

  try {
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
  } catch (error) {
    /*
     * Foreign-key protection.
     *
     * If another relation does not allow deletion,
     * return a clean application error instead of exposing
     * Prisma internals to the frontend.
     */
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new Error(
        "This user cannot be deleted because related records still exist",
      );
    }

    throw error;
  }

  return {
    success: true,
    message: "User deleted successfully",
  };
};