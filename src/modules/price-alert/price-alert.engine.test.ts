import { describe, expect, it, vi } from "vitest";

import {
  shouldTriggerPriceAlert,
  getLowestInStockPrice,
  processPriceAlert,
  processActivePriceAlerts,
} from "./price-alert.engine";

describe("Price Alert Engine", () => {
  describe("shouldTriggerPriceAlert", () => {
    it("should trigger when current price is equal to target price", () => {
      expect(shouldTriggerPriceAlert(44999, 44999)).toBe(true);
    });

    it("should trigger when current price is below target price", () => {
      expect(shouldTriggerPriceAlert(39999, 44999)).toBe(true);
    });

    it("should not trigger when current price is above target price", () => {
      expect(shouldTriggerPriceAlert(49999, 44999)).toBe(false);
    });
  });

  describe("getLowestInStockPrice", () => {
    it("should return the lowest in-stock price", () => {
      const prices = [
        { amount: 49999, inStock: true },
        { amount: 45999, inStock: true },
        { amount: 47999, inStock: false },
      ];

      const result = getLowestInStockPrice(prices);

      expect(result).toBe(45999);
    });

    it("should ignore out-of-stock prices", () => {
      const prices = [
        { amount: 39999, inStock: false },
        { amount: 45999, inStock: true },
        { amount: 49999, inStock: true },
      ];

      const result = getLowestInStockPrice(prices);

      expect(result).toBe(45999);
    });

    it("should return null when no prices are in stock", () => {
      const prices = [
        { amount: 39999, inStock: false },
        { amount: 45999, inStock: false },
      ];

      const result = getLowestInStockPrice(prices);

      expect(result).toBeNull();
    });

    it("should return null for an empty price list", () => {
      const result = getLowestInStockPrice([]);

      expect(result).toBeNull();
    });
  });

  describe("processPriceAlert", () => {
    it("should trigger an active alert when the lowest in-stock price reaches the target", async () => {
      const prismaMock = {
        priceAlert: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "alert-1",
              targetPrice: 44999,
              currency: "INR",
              isActive: true,

              user: {
                id: "user-1",
                email: "user@example.com",
              },

              product: {
                name: "Samsung Galaxy S26 Ultra",
                slug: "samsung-galaxy-s26-ultra",
                prices: [
                  { amount: 49999, inStock: true },
                  { amount: 44999, inStock: true },
                  { amount: 39999, inStock: false },
                ],
              },
            },
          ]),

          updateMany: vi.fn().mockResolvedValue({
            count: 1,
          }),
        },
      };

      const result = await processPriceAlert(
        prismaMock as any,
        "alert-1",
      );

      expect(result.triggered).toBe(true);

      expect(result.alert).toEqual({
        alertId: "alert-1",
        userId: "user-1",
        email: "user@example.com",
        productName: "Samsung Galaxy S26 Ultra",
        productSlug: "samsung-galaxy-s26-ultra",
        targetPrice: 44999,
        currentPrice: 44999,
        currency: "INR",
      });

      expect(
        prismaMock.priceAlert.updateMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "alert-1",
            isActive: true,
          },
          data: expect.objectContaining({
            isActive: false,
          }),
        }),
      );
    });

    it("should not trigger when the lowest in-stock price is above the target", async () => {
      const prismaMock = {
        priceAlert: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "alert-2",
              targetPrice: 44999,
              currency: "INR",
              isActive: true,

              user: {
                id: "user-1",
                email: "user@example.com",
              },

              product: {
                name: "Samsung Galaxy S26 Ultra",
                slug: "samsung-galaxy-s26-ultra",
                prices: [
                  { amount: 49999, inStock: true },
                  { amount: 45999, inStock: true },
                  { amount: 39999, inStock: false },
                ],
              },
            },
          ]),

          updateMany: vi.fn().mockResolvedValue({
            count: 0,
          }),
        },
      };

      const result = await processPriceAlert(
        prismaMock as any,
        "alert-2",
      );

      expect(result.triggered).toBe(false);
      expect(result.alert).toBeUndefined();

      expect(
        prismaMock.priceAlert.updateMany,
      ).not.toHaveBeenCalled();
    });

    it("should not trigger when the product has no in-stock prices", async () => {
      const prismaMock = {
        priceAlert: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "alert-3",
              targetPrice: 44999,
              currency: "INR",
              isActive: true,

              user: {
                id: "user-1",
                email: "user@example.com",
              },

              product: {
                name: "Samsung Galaxy S26 Ultra",
                slug: "samsung-galaxy-s26-ultra",
                prices: [
                  { amount: 39999, inStock: false },
                  { amount: 41999, inStock: false },
                ],
              },
            },
          ]),

          updateMany: vi.fn().mockResolvedValue({
            count: 0,
          }),
        },
      };

      const result = await processPriceAlert(
        prismaMock as any,
        "alert-3",
      );

      expect(result.triggered).toBe(false);
      expect(result.alert).toBeUndefined();

      expect(
        prismaMock.priceAlert.updateMany,
      ).not.toHaveBeenCalled();
    });

    it("should not trigger when the alert does not exist or is inactive", async () => {
      const prismaMock = {
        priceAlert: {
          findMany: vi.fn().mockResolvedValue([]),
          updateMany: vi.fn(),
        },
      };

      const result = await processPriceAlert(
        prismaMock as any,
        "missing-alert",
      );

      expect(result.triggered).toBe(false);
      expect(result.alert).toBeUndefined();

      expect(
        prismaMock.priceAlert.updateMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe("processActivePriceAlerts", () => {
    it("should process all active price alerts", async () => {
      const prismaMock = {
        priceAlert: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "alert-1",
              targetPrice: 44999,
              currency: "INR",
              isActive: true,

              user: {
                id: "user-1",
                email: "user1@example.com",
              },

              product: {
                name: "Samsung Galaxy S26 Ultra",
                slug: "samsung-galaxy-s26-ultra",
                prices: [
                  { amount: 44999, inStock: true },
                ],
              },
            },
            {
              id: "alert-2",
              targetPrice: 39999,
              currency: "INR",
              isActive: true,

              user: {
                id: "user-2",
                email: "user2@example.com",
              },

              product: {
                name: "iPhone 17 Pro",
                slug: "iphone-17-pro",
                prices: [
                  { amount: 45999, inStock: true },
                ],
              },
            },
          ]),

          updateMany: vi.fn().mockResolvedValue({
            count: 1,
          }),
        },
      };

      const result = await processActivePriceAlerts(
        prismaMock as any,
      );

      expect(result.processed).toBe(2);
      expect(result.triggered).toBe(1);

      expect(result.triggeredAlerts).toHaveLength(1);

      expect(result.triggeredAlerts[0]).toEqual({
        alertId: "alert-1",
        userId: "user-1",
        email: "user1@example.com",
        productName: "Samsung Galaxy S26 Ultra",
        productSlug: "samsung-galaxy-s26-ultra",
        targetPrice: 44999,
        currentPrice: 44999,
        currency: "INR",
      });

      expect(
        prismaMock.priceAlert.updateMany,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe("atomic price alert triggering", () => {
    it("should count an alert as triggered only when the active alert was actually updated", async () => {
      const prismaMock = {
        priceAlert: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "alert-1",
              targetPrice: 44999,
              currency: "INR",
              isActive: true,

              user: {
                id: "user-1",
                email: "user@example.com",
              },

              product: {
                name: "Samsung Galaxy S26 Ultra",
                slug: "samsung-galaxy-s26-ultra",
                prices: [
                  { amount: 44999, inStock: true },
                ],
              },
            },
          ]),

          updateMany: vi.fn().mockResolvedValue({
            count: 1,
          }),
        },
      };

      const result = await processActivePriceAlerts(
        prismaMock as any,
      );

      expect(result.triggered).toBe(1);
      expect(result.triggeredAlerts).toHaveLength(1);

      expect(
        prismaMock.priceAlert.updateMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "alert-1",
            isActive: true,
          },
        }),
      );
    });

    it("should not count the alert as triggered when another worker already triggered it", async () => {
      const prismaMock = {
        priceAlert: {
          findMany: vi.fn().mockResolvedValue([
            {
              id: "alert-2",
              targetPrice: 44999,
              currency: "INR",
              isActive: true,

              user: {
                id: "user-2",
                email: "user@example.com",
              },

              product: {
                name: "Samsung Galaxy S26 Ultra",
                slug: "samsung-galaxy-s26-ultra",
                prices: [
                  { amount: 44999, inStock: true },
                ],
              },
            },
          ]),

          updateMany: vi.fn().mockResolvedValue({
            count: 0,
          }),
        },
      };

      const result = await processActivePriceAlerts(
        prismaMock as any,
      );

      expect(result.processed).toBe(1);
      expect(result.triggered).toBe(0);
      expect(result.triggeredAlerts).toHaveLength(0);

      expect(
        prismaMock.priceAlert.updateMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "alert-2",
            isActive: true,
          },
        }),
      );
    });
  });
});