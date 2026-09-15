import prisma from "../../db/prisma";

export type AnalyticsDateRange = {
  startDate: Date;
  endDate: Date;
};

export type OverviewAnalytics = {
  period: {
    startDate: string;
    endDate: string;
  };

  users: {
    total: number;
    newUsers: number;
    growthPercent: number;
  };

  sessions: {
    total: number;
    active: number;
    growthPercent: number;
  };

  products: {
    total: number;
    active: number;
    newProducts: number;
    growthPercent: number;
  };

  engagement: {
    favorites: number;
    comparisons: number;
    reviews: number;
    searches: number;
  };

  content: {
    totalNews: number;
    publishedNews: number;
  };
};

/* =========================================================
   DATE HELPERS
========================================================= */

function getPreviousPeriod(
  startDate: Date,
  endDate: Date,
) {
  const duration =
    endDate.getTime() -
    startDate.getTime();

  return {
    startDate: new Date(
      startDate.getTime() - duration,
    ),
    endDate: new Date(
      endDate.getTime() - duration,
    ),
  };
}

/* =========================================================
   GROWTH
========================================================= */

function calculateGrowth(
  current: number,
  previous: number,
) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Number(
    (
      ((current - previous) / previous) *
      100
    ).toFixed(1),
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

export async function getOverviewAnalytics(
  range: AnalyticsDateRange,
): Promise<OverviewAnalytics> {
  const {
    startDate,
    endDate,
  } = range;

  const previous =
    getPreviousPeriod(
      startDate,
      endDate,
    );

  /* -------------------------------------------------------
     USERS
  ------------------------------------------------------- */

  const [
    totalUsers,
    newUsers,
    previousNewUsers,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        isDeleted: false,
      },
    }),

    prisma.user.count({
      where: {
        isDeleted: false,
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    }),

    prisma.user.count({
      where: {
        isDeleted: false,
        createdAt: {
          gte: previous.startDate,
          lt: previous.endDate,
        },
      },
    }),
  ]);

  /* -------------------------------------------------------
     SESSIONS
  ------------------------------------------------------- */

  const [
    totalSessions,
    activeSessions,
    previousSessions,
  ] = await Promise.all([
    prisma.userSession.count({
      where: {
        startedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    }),

    prisma.userSession.count({
      where: {
        isActive: true,
      },
    }),

    prisma.userSession.count({
      where: {
        startedAt: {
          gte: previous.startDate,
          lt: previous.endDate,
        },
      },
    }),
  ]);

  /* -------------------------------------------------------
     PRODUCTS
  ------------------------------------------------------- */

  const [
    totalProducts,
    activeProducts,
    newProducts,
    previousProducts,
  ] = await Promise.all([
    prisma.product.count(),

    prisma.product.count({
      where: {
        isActive: true,
      },
    }),

    prisma.product.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    }),

    prisma.product.count({
      where: {
        createdAt: {
          gte: previous.startDate,
          lt: previous.endDate,
        },
      },
    }),
  ]);

  /* -------------------------------------------------------
     ENGAGEMENT
  ------------------------------------------------------- */

  const [
    favorites,
    comparisons,
    reviews,
    searches,
  ] = await Promise.all([
    prisma.favorite.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    }),

    prisma.comparison.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    }),

    prisma.review.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    }),

    prisma.searchHistory.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    }),
  ]);

  /* -------------------------------------------------------
     CONTENT
  ------------------------------------------------------- */

  const [
    totalNews,
    publishedNews,
  ] = await Promise.all([
    prisma.news.count(),

    prisma.news.count({
      where: {
        status: "PUBLISHED",
      },
    }),
  ]);

  return {
    period: {
      startDate:
        startDate.toISOString(),
      endDate:
        endDate.toISOString(),
    },

    users: {
      total: totalUsers,
      newUsers,
      growthPercent:
        calculateGrowth(
          newUsers,
          previousNewUsers,
        ),
    },

    sessions: {
      total: totalSessions,
      active: activeSessions,
      growthPercent:
        calculateGrowth(
          totalSessions,
          previousSessions,
        ),
    },

    products: {
      total: totalProducts,
      active: activeProducts,
      newProducts,
      growthPercent:
        calculateGrowth(
          newProducts,
          previousProducts,
        ),
    },

    engagement: {
      favorites,
      comparisons,
      reviews,
      searches,
    },

    content: {
      totalNews,
      publishedNews,
    },
  };
}