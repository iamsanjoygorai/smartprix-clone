import prisma from "../../db/prisma";

import type { Prisma } from "@prisma/client";

import type {
  AnalyticsOverview,
  AnalyticsUsers,
  AnalyticsUserGrowth,
  AnalyticsProducts,
  AnalyticsProductGrowth,
  AnalyticsTopProducts,
  AnalyticsSearches,
  AnalyticsEngagement,
  AnalyticsActivity,
} from "./analytics.types";

import {
  ANALYTICS_EVENTS,
  type AnalyticsEventType,
} from "./analytics.events";


interface TrackAnalyticsEventInput {
  eventType: AnalyticsEventType;
  userId?: string | null;
  sessionId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  path?: string | null;
  referrer?: string | null;
  metadata?: object | null;
  deviceType?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  ipAddress?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  timezone?: string | null;
}

export const trackAnalyticsEvent = async (
  input: TrackAnalyticsEventInput,
): Promise<void> => {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: input.eventType,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        path: input.path ?? null,
        referrer: input.referrer ?? null,
        metadata: input.metadata ?? undefined,
        deviceType: input.deviceType ?? null,
        browser: input.browser ?? null,
        operatingSystem: input.operatingSystem ?? null,
        ipAddress: input.ipAddress ?? null,
        country: input.country ?? null,
        state: input.state ?? null,
        city: input.city ?? null,
        timezone: input.timezone ?? null,
      },
    });

    console.log(
      "✅ ANALYTICS EVENT CREATED:",
      input.eventType,
      input.entityId,
    );
  } catch (error) {
    console.error(
      "❌ ANALYTICS EVENT CREATE FAILED:",
      error,
    );

    throw error;
  }
};

export const getAnalyticsOverview =
  async (): Promise<AnalyticsOverview> => {
    const [
      totalUsers,
      activeUsers,
      totalProducts,
      activeProducts,
      totalReviews,
      publishedReviews,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          isDeleted: false,
        },
      }),

      prisma.user.count({
        where: {
          isDisabled: false,
          isDeleted: false,
        },
      }),

      prisma.product.count(),

      prisma.product.count({
        where: {
          isActive: true,
        },
      }),

      prisma.review.count(),

      prisma.review.count({
        where: {
          isPublished: true,
        },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
      },

      products: {
        total: totalProducts,
        active: activeProducts,
      },

      reviews: {
        total: totalReviews,
        published: publishedReviews,
      },
    };
  };


  export const getAnalyticsUsers =
  async (): Promise<AnalyticsUsers> => {
    const [
      total,
      active,
      disabled,
      deleted,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          isDeleted: false,
        },
      }),

      prisma.user.count({
        where: {
          isDeleted: false,
          isDisabled: false,
        },
      }),

      prisma.user.count({
        where: {
          isDeleted: false,
          isDisabled: true,
        },
      }),

      prisma.user.count({
        where: {
          isDeleted: true,
        },
      }),
    ]);

    return {
      total,
      active,
      disabled,
      deleted,
    };
  };


  export const getAnalyticsUserGrowth =
  async (
    days = 30,
  ): Promise<AnalyticsUserGrowth> => {
    const safeDays = Math.min(
      Math.max(Math.floor(days), 1),
      365,
    );

    const endDate = new Date();

    const startDate = new Date(endDate);

    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(
      startDate.getDate() - (safeDays - 1),
    );

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const counts = new Map<string, number>();

    for (let index = 0; index < safeDays; index += 1) {
      const date = new Date(startDate);

      date.setDate(
        startDate.getDate() + index,
      );

      const key = date.toISOString().slice(0, 10);

      counts.set(key, 0);
    }

    for (const user of users) {
      const key = user.createdAt
        .toISOString()
        .slice(0, 10);

      counts.set(
        key,
        (counts.get(key) ?? 0) + 1,
      );
    }

    const series = Array.from(
      counts.entries(),
    ).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      range: `${safeDays}d`,
      total: users.length,
      series,
    };
  };

  export const getAnalyticsProducts =
  async (): Promise<AnalyticsProducts> => {
    const [
      total,
      active,
      inactive,
    ] = await Promise.all([
      prisma.product.count(),

      prisma.product.count({
        where: {
          isActive: true,
        },
      }),

      prisma.product.count({
        where: {
          isActive: false,
        },
      }),
    ]);

    return {
      total,
      active,
      inactive,
    };
  };

  export const getAnalyticsProductGrowth =
  async (
    days = 30,
  ): Promise<AnalyticsProductGrowth> => {
    const safeDays = Math.min(
      Math.max(Math.floor(days), 1),
      365,
    );

    const endDate = new Date();

    const startDate = new Date(endDate);

    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(
      startDate.getDate() - (safeDays - 1),
    );

    const products = await prisma.product.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const counts = new Map<string, number>();

    for (let index = 0; index < safeDays; index += 1) {
      const date = new Date(startDate);

      date.setDate(
        startDate.getDate() + index,
      );

      const key = date.toISOString().slice(0, 10);

      counts.set(key, 0);
    }

    for (const product of products) {
      const key = product.createdAt
        .toISOString()
        .slice(0, 10);

      counts.set(
        key,
        (counts.get(key) ?? 0) + 1,
      );
    }

    const series = Array.from(
      counts.entries(),
    ).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      range: `${safeDays}d`,
      total: products.length,
      series,
    };
  };


  export const getAnalyticsTopProducts = async (
  days = 30,
): Promise<AnalyticsTopProducts> => {
  const safeDays = Math.min(
    Math.max(Number(days) || 30, 1),
    365,
  );

  const endDate = new Date();

  const startDate = new Date(endDate);
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(
    startDate.getDate() - (safeDays - 1),
  );

  const events = await prisma.analyticsEvent.findMany({
    where: {
      eventType: ANALYTICS_EVENTS.PRODUCT_VIEW,
      entityType: "Product",
      entityId: {
        not: null,
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      entityId: true,
    },
  });

  const productCounts = new Map<string, number>();

  for (const event of events) {
    if (!event.entityId) {
      continue;
    }

    productCounts.set(
      event.entityId,
      (productCounts.get(event.entityId) ?? 0) + 1,
    );
  }

  const productIds = [...productCounts.keys()];

  if (productIds.length === 0) {
    return {
      range: `${safeDays}d`,
      totalEvents: 0,
      products: [],
    };
  }

  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  const productMap = new Map(
    products.map((product) => [
      product.id,
      product,
    ]),
  );

  const topProducts = productIds
    .map((productId) => {
      const product = productMap.get(productId);

      if (!product) {
        return null;
      }

      return {
        productId: product.id,
        productName: product.name,
        slug: product.slug,
        eventCount: productCounts.get(productId) ?? 0,
      };
    })
    .filter(
      (
        product,
      ): product is {
        productId: string;
        productName: string;
        slug: string;
        eventCount: number;
      } => product !== null,
    )
    .sort(
      (a, b) => b.eventCount - a.eventCount,
    );

  return {
    range: `${safeDays}d`,
    totalEvents: events.length,
    products: topProducts,
  };
};

export const getAnalyticsSearches = async (
  days = 30,
): Promise<AnalyticsSearches> => {
  const safeDays = Math.min(Math.max(days, 1), 365);

  const startDate = new Date();

  startDate.setDate(startDate.getDate() - safeDays);

  const searchQueries = await prisma.searchQuery.findMany({
    where: {
      lastSearchedAt: {
        gte: startDate,
      },
    },
    orderBy: {
      count: "desc",
    },
    select: {
      query: true,
      count: true,
    },
  });

  const totalSearches = searchQueries.reduce(
    (total, item) => total + item.count,
    0,
  );

  const uniqueSearches = searchQueries.length;

  const topSearches = searchQueries
    .slice(0, 10)
    .map((item) => ({
      query: item.query,
      count: item.count,
    }));

  return {
    range: `${safeDays}d`,
    totalSearches,
    uniqueSearches,
    topSearches,
  };
};

export const getAnalyticsEngagement = async (
  days = 30,
): Promise<AnalyticsEngagement> => {
  const safeDays = Math.min(Math.max(days, 1), 365);

  const startDate = new Date();

  startDate.setDate(startDate.getDate() - safeDays);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      eventType: true,
      entityType: true,
      entityId: true,
    },
  });

  const eventCounts = new Map<string, number>();

  const productIds = new Set<string>();

  for (const event of events) {
    eventCounts.set(
      event.eventType,
      (eventCounts.get(event.eventType) ?? 0) + 1,
    );

    if (
      event.eventType === ANALYTICS_EVENTS.PRODUCT_VIEW &&
      event.entityType === "Product" &&
      event.entityId
    ) {
      productIds.add(event.entityId);
    }
  }

  const eventBreakdown = Array.from(eventCounts.entries())
    .map(([eventType, count]) => ({
      eventType,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    range: `${safeDays}d`,
    totalEvents: events.length,
    uniqueProductsViewed: productIds.size,
    events: eventBreakdown,
  };
};

export const getAnalyticsActivity = async (
  days = 30,
): Promise<AnalyticsActivity> => {
  const safeDays = Math.min(Math.max(days, 1), 365);

  const startDate = new Date();

  startDate.setDate(startDate.getDate() - safeDays);

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      action: true,
    },
  });

  const actionCounts = new Map<string, number>();

  for (const log of auditLogs) {
    actionCounts.set(
      log.action,
      (actionCounts.get(log.action) ?? 0) + 1,
    );
  }

  const activities = Array.from(actionCounts.entries())
    .map(([action, count]) => ({
      action,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    range: `${safeDays}d`,
    totalActivities: auditLogs.length,
    activities,
  };
};