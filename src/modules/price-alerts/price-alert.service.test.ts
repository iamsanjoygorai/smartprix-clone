import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/prisma", () => ({
  default: {
    product: {
      findUnique: vi.fn(),
    },
    priceAlert: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "../../db/prisma";

import {
  createPriceAlert,
  getUserPriceAlerts,
  getUserPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
} from "./price-alert.service";

describe("Price Alert Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPriceAlert", () => {
    it("creates an alert for the authenticated user", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        id: "product-1",
      } as never);

      vi.mocked(prisma.priceAlert.create).mockResolvedValue({
        id: "alert-1",
        userId: "user-1",
        productId: "product-1",
        targetPrice: 69999,
        currency: "INR",
        isActive: true,
        triggeredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const result = await createPriceAlert(
        "user-1",
        {
          productId: "product-1",
          targetPrice: 69999,
          currency: "INR",
        },
      );

      expect(
        prisma.product.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: "product-1",
        },
        select: {
          id: true,
        },
      });

      expect(
        prisma.priceAlert.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          productId: "product-1",
          targetPrice: 69999,
          currency: "INR",
        },
      });

      expect(result.id).toBe("alert-1");
    });

    it("throws when the product does not exist", async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(
        null,
      );

      await expect(
        createPriceAlert("user-1", {
          productId: "missing-product",
          targetPrice: 69999,
        }),
      ).rejects.toThrow("Product not found");

      expect(
        prisma.priceAlert.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe("getUserPriceAlerts", () => {
    it("returns only alerts belonging to the authenticated user", async () => {
      const alerts = [
        {
          id: "alert-1",
          userId: "user-1",
          productId: "product-1",
          targetPrice: 69999,
          currency: "INR",
          isActive: true,
          triggeredAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(
        prisma.priceAlert.findMany,
      ).mockResolvedValue(alerts as never);

      const result =
        await getUserPriceAlerts("user-1");

      expect(
        prisma.priceAlert.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "user-1",
          },
        }),
      );

      expect(result).toEqual(alerts);
    });
  });

  describe("getUserPriceAlert", () => {
    it("returns an alert only when it belongs to the user", async () => {
      const alert = {
        id: "alert-1",
        userId: "user-1",
        productId: "product-1",
        targetPrice: 69999,
        currency: "INR",
        isActive: true,
        triggeredAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(
        prisma.priceAlert.findFirst,
      ).mockResolvedValue(alert as never);

      const result =
        await getUserPriceAlert(
          "user-1",
          "alert-1",
        );

      expect(
        prisma.priceAlert.findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "alert-1",
            userId: "user-1",
          },
        }),
      );

      expect(result).toEqual(alert);
    });

    it("returns null when the alert belongs to another user", async () => {
      vi.mocked(
        prisma.priceAlert.findFirst,
      ).mockResolvedValue(null);

      const result =
        await getUserPriceAlert(
          "user-1",
          "user-2-alert",
        );

      expect(result).toBeNull();
    });
  });

  describe("updatePriceAlert", () => {
    it("updates the target price and resets triggeredAt", async () => {
      vi.mocked(
        prisma.priceAlert.findFirst,
      ).mockResolvedValue({
        id: "alert-1",
      } as never);

      vi.mocked(
        prisma.priceAlert.update,
      ).mockResolvedValue({
        id: "alert-1",
        userId: "user-1",
        targetPrice: 64999,
        currency: "INR",
        isActive: true,
        triggeredAt: null,
      } as never);

      const result =
        await updatePriceAlert(
          "user-1",
          "alert-1",
          {
            targetPrice: 64999,
          },
        );

      expect(
        prisma.priceAlert.update,
      ).toHaveBeenCalledWith({
        where: {
          id: "alert-1",
        },
        data: {
          targetPrice: 64999,
          triggeredAt: null,
        },
      });

      expect(result.targetPrice).toBe(
        64999,
      );
    });

    it("updates the active state", async () => {
      vi.mocked(
        prisma.priceAlert.findFirst,
      ).mockResolvedValue({
        id: "alert-1",
      } as never);

      vi.mocked(
        prisma.priceAlert.update,
      ).mockResolvedValue({
        id: "alert-1",
        isActive: false,
      } as never);

      await updatePriceAlert(
        "user-1",
        "alert-1",
        {
          isActive: false,
        },
      );

      expect(
        prisma.priceAlert.update,
      ).toHaveBeenCalledWith({
        where: {
          id: "alert-1",
        },
        data: {
          isActive: false,
        },
      });
    });

    it("throws when the alert does not belong to the user", async () => {
      vi.mocked(
        prisma.priceAlert.findFirst,
      ).mockResolvedValue(null);

      await expect(
        updatePriceAlert(
          "user-1",
          "other-alert",
          {
            targetPrice: 60000,
          },
        ),
      ).rejects.toThrow(
        "Price alert not found",
      );

      expect(
        prisma.priceAlert.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe("deletePriceAlert", () => {
    it("deletes an alert belonging to the user", async () => {
      vi.mocked(
        prisma.priceAlert.findFirst,
      ).mockResolvedValue({
        id: "alert-1",
      } as never);

      vi.mocked(
        prisma.priceAlert.delete,
      ).mockResolvedValue({
        id: "alert-1",
      } as never);

      await deletePriceAlert(
        "user-1",
        "alert-1",
      );

      expect(
        prisma.priceAlert.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: "alert-1",
        },
      });
    });

    it("does not delete another user's alert", async () => {
      vi.mocked(
        prisma.priceAlert.findFirst,
      ).mockResolvedValue(null);

      await expect(
        deletePriceAlert(
          "user-1",
          "other-alert",
        ),
      ).rejects.toThrow(
        "Price alert not found",
      );

      expect(
        prisma.priceAlert.delete,
      ).not.toHaveBeenCalled();
    });
  });
});