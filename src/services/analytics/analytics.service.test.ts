import { describe, expect, it, vi } from "vitest";

import prisma from "../../db/prisma";

import {
  getAnalyticsSearches,
  getAnalyticsEngagement,
  getAnalyticsActivity,
} from "./analytics.service";

vi.mock("../../db/prisma", () => ({
  default: {
    searchQuery: {
      findMany: vi.fn(),
    },
    analyticsEvent: {
      findMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
  },
}));

describe("getAnalyticsSearches", () => {
  it("should calculate total searches, unique searches and top searches", async () => {
    vi.mocked(prisma.searchQuery.findMany).mockResolvedValue([
      {
        query: "Samsung",
        normalized: "samsung",
        count: 10,
        lastSearchedAt: new Date(),
      },
      {
        query: "iPhone",
        normalized: "iphone",
        count: 7,
        lastSearchedAt: new Date(),
      },
      {
        query: "OnePlus",
        normalized: "oneplus",
        count: 3,
        lastSearchedAt: new Date(),
      },
    ] as never);

    const result = await getAnalyticsSearches(30);

    expect(result).toEqual({
      range: "30d",
      totalSearches: 20,
      uniqueSearches: 3,
      topSearches: [
        {
          query: "Samsung",
          count: 10,
        },
        {
          query: "iPhone",
          count: 7,
        },
        {
          query: "OnePlus",
          count: 3,
        },
      ],
    });
  });
});

describe("getAnalyticsEngagement", () => {
  it("should calculate engagement metrics from analytics events", async () => {
    vi.mocked(prisma.analyticsEvent.findMany).mockResolvedValue([
      {
        eventType: "PRODUCT_VIEW",
        entityType: "Product",
        entityId: "product-1",
      },
      {
        eventType: "PRODUCT_VIEW",
        entityType: "Product",
        entityId: "product-1",
      },
      {
        eventType: "PRODUCT_VIEW",
        entityType: "Product",
        entityId: "product-2",
      },
    ] as never);

    const result = await getAnalyticsEngagement(30);

    expect(result).toEqual({
      range: "30d",
      totalEvents: 3,
      uniqueProductsViewed: 2,
      events: [
        {
          eventType: "PRODUCT_VIEW",
          count: 3,
        },
      ],
    });
  });
});

describe("getAnalyticsActivity", () => {
  it("should calculate activity metrics from audit logs", async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      {
        action: "LOGIN",
        category: "AUTH",
        createdAt: new Date(),
      },
      {
        action: "LOGIN",
        category: "AUTH",
        createdAt: new Date(),
      },
      {
        action: "CREATE_PRODUCT",
        category: "PRODUCT",
        createdAt: new Date(),
      },
    ] as never);

    const result = await getAnalyticsActivity(30);

    expect(result).toEqual({
      range: "30d",
      totalActivities: 3,
      activities: [
        {
          action: "LOGIN",
          count: 2,
        },
        {
          action: "CREATE_PRODUCT",
          count: 1,
        },
      ],
    });
  });
});