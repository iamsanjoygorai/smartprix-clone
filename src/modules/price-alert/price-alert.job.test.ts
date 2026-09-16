import { describe, expect, it, vi } from "vitest";

import prisma from "../../db/prisma";

import {
  runPriceAlertJob,
  runPriceAlertJobWithPrisma,
} from "./price-alert.job";

describe("Price Alert Job", () => {
  describe("runPriceAlertJob", () => {
    it("should run the active price alert processor", async () => {
      const processActivePriceAlerts = vi
        .fn()
        .mockResolvedValue({
          processed: 5,
          triggered: 2,
          triggeredAlerts: [],
        });

      const sendNotifications = vi
        .fn()
        .mockResolvedValue({
          attempted: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
        });

      const result = await runPriceAlertJob({
        processActivePriceAlerts,
        sendNotifications,
      });

      expect(processActivePriceAlerts).toHaveBeenCalledTimes(1);
      expect(sendNotifications).toHaveBeenCalledTimes(1);
      expect(sendNotifications).toHaveBeenCalledWith([]);

      expect(result).toEqual({
        processed: 5,
        triggered: 2,
        triggeredAlerts: [],
        notifications: {
          attempted: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
        },
      });
    });

    it("should return the processor result together with notification results", async () => {
      const triggeredAlerts = [
        {
          alertId: "alert-1",
          userId: "user-1",
          email: "user@example.com",
          productName: "Samsung Galaxy S26 Ultra",
          productSlug: "samsung-galaxy-s26-ultra",
          targetPrice: 44999,
          currentPrice: 44999,
          currency: "INR",
        },
      ];

      const processActivePriceAlerts = vi
        .fn()
        .mockResolvedValue({
          processed: 10,
          triggered: 1,
          triggeredAlerts,
        });

      const sendNotifications = vi
        .fn()
        .mockResolvedValue({
          attempted: 1,
          sent: 1,
          failed: 0,
          skipped: 0,
        });

      const result = await runPriceAlertJob({
        processActivePriceAlerts,
        sendNotifications,
      });

      expect(result.processed).toBe(10);
      expect(result.triggered).toBe(1);
      expect(result.triggeredAlerts).toEqual(triggeredAlerts);

      expect(result.notifications).toEqual({
        attempted: 1,
        sent: 1,
        failed: 0,
        skipped: 0,
      });
    });

    it("should send notifications for triggered alerts", async () => {
      const triggeredAlerts = [
        {
          alertId: "alert-1",
          userId: "user-1",
          email: "user@example.com",
          productName: "Samsung Galaxy S26 Ultra",
          productSlug: "samsung-galaxy-s26-ultra",
          targetPrice: 44999,
          currentPrice: 43999,
          currency: "INR",
        },
        {
          alertId: "alert-2",
          userId: "user-2",
          email: "user2@example.com",
          productName: "iPhone 17 Pro",
          productSlug: "iphone-17-pro",
          targetPrice: 99999,
          currentPrice: 97999,
          currency: "INR",
        },
      ];

      const processActivePriceAlerts = vi
        .fn()
        .mockResolvedValue({
          processed: 5,
          triggered: 2,
          triggeredAlerts,
        });

      const sendNotifications = vi
        .fn()
        .mockResolvedValue({
          attempted: 2,
          sent: 2,
          failed: 0,
          skipped: 0,
        });

      const result = await runPriceAlertJob({
        processActivePriceAlerts,
        sendNotifications,
      });

      expect(sendNotifications).toHaveBeenCalledTimes(1);
      expect(sendNotifications).toHaveBeenCalledWith(
        triggeredAlerts,
      );

      expect(result.notifications.sent).toBe(2);
      expect(result.notifications.failed).toBe(0);
    });

    it("should handle notification failures without changing the processor result", async () => {
      const triggeredAlerts = [
        {
          alertId: "alert-1",
          userId: "user-1",
          email: "user@example.com",
          productName: "Samsung Galaxy S26 Ultra",
          productSlug: "samsung-galaxy-s26-ultra",
          targetPrice: 44999,
          currentPrice: 44999,
          currency: "INR",
        },
      ];

      const processActivePriceAlerts = vi
        .fn()
        .mockResolvedValue({
          processed: 5,
          triggered: 1,
          triggeredAlerts,
        });

      const sendNotifications = vi
        .fn()
        .mockResolvedValue({
          attempted: 1,
          sent: 0,
          failed: 1,
          skipped: 0,
        });

      const result = await runPriceAlertJob({
        processActivePriceAlerts,
        sendNotifications,
      });

      expect(result.processed).toBe(5);
      expect(result.triggered).toBe(1);
      expect(result.triggeredAlerts).toEqual(triggeredAlerts);

      expect(result.notifications).toEqual({
        attempted: 1,
        sent: 0,
        failed: 1,
        skipped: 0,
      });
    });

    it("should propagate processor errors", async () => {
      const error = new Error("Database unavailable");

      const processActivePriceAlerts = vi
        .fn()
        .mockRejectedValue(error);

      const sendNotifications = vi.fn();

      await expect(
        runPriceAlertJob({
          processActivePriceAlerts,
          sendNotifications,
        }),
      ).rejects.toThrow("Database unavailable");

      expect(sendNotifications).not.toHaveBeenCalled();
    });
  });

  describe("runPriceAlertJobWithPrisma", () => {
   it("should run the price alert engine using Prisma", async () => {
  const processActivePriceAlerts = vi
    .fn()
    .mockResolvedValue({
      processed: 4,
      triggered: 1,
      triggeredAlerts: [],
    });

  const result = await runPriceAlertJobWithPrisma(
    prisma,
    processActivePriceAlerts,
  );

  expect(processActivePriceAlerts).toHaveBeenCalledTimes(1);

  expect(result).toEqual({
    processed: 4,
    triggered: 1,
    triggeredAlerts: [],
    notifications: {
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
    },
  });
});
  });
});