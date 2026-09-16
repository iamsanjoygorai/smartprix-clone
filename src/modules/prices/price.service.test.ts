import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import prisma from "../../db/prisma";

import {
  getProductPrices,
  getProductPriceHistory,
  getBestPrice,
  getPriceStatistics,
} from "./price.service";

vi.mock("../../db/prisma", () => ({
  default: {
    product: {
      findUnique: vi.fn(),
    },
    price: {
      findMany: vi.fn(),
    },
  },
}));

describe("Price Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProductPrices", () => {
    it("resolves product slug and returns latest current price per seller and variant", async () => {
      vi.mocked(
        prisma.product.findUnique,
      ).mockResolvedValue({
        id: "product-1",
      } as any);

      vi.mocked(
        prisma.price.findMany,
      ).mockResolvedValue([
        {
          id: "price-flipkart-new",
          productId: "product-1",
          sellerId: "flipkart",
          variantId: "variant-1",
          amount: 75999,
          currency: "INR",
          inStock: true,
          recordedAt: new Date("2026-09-10"),
          seller: {
            id: "flipkart",
            name: "Flipkart",
          },
          variant: {
            id: "variant-1",
          },
        },
        {
          id: "price-flipkart-old",
          productId: "product-1",
          sellerId: "flipkart",
          variantId: "variant-1",
          amount: 69999,
          currency: "INR",
          inStock: true,
          recordedAt: new Date("2026-09-08"),
          seller: {
            id: "flipkart",
            name: "Flipkart",
          },
          variant: {
            id: "variant-1",
          },
        },
        {
          id: "price-amazon",
          productId: "product-1",
          sellerId: "amazon",
          variantId: "variant-1",
          amount: 74999,
          currency: "INR",
          inStock: true,
          recordedAt: new Date("2026-09-10"),
          seller: {
            id: "amazon",
            name: "Amazon",
          },
          variant: {
            id: "variant-1",
          },
        },
      ] as any);

      const result =
        await getProductPrices(
          "samsung-galaxy-s25",
        );

      expect(result).toHaveLength(2);

      expect(
        Number(result[0]?.amount),
      ).toBe(74999);

      expect(
        Number(result[1]?.amount),
      ).toBe(75999);

      expect(
        result.some(
          (price) =>
            Number(price.amount) === 69999,
        ),
      ).toBe(false);
    });

    it("does not return a seller when its latest observation is out of stock", async () => {
      vi.mocked(
        prisma.product.findUnique,
      ).mockResolvedValue({
        id: "product-1",
      } as any);

      vi.mocked(
        prisma.price.findMany,
      ).mockResolvedValue([
        {
          id: "latest",
          productId: "product-1",
          sellerId: "flipkart",
          variantId: "variant-1",
          amount: 75999,
          inStock: false,
          recordedAt: new Date("2026-09-10"),
        },
        {
          id: "older",
          productId: "product-1",
          sellerId: "flipkart",
          variantId: "variant-1",
          amount: 69999,
          inStock: true,
          recordedAt: new Date("2026-09-08"),
        },
      ] as any);

      const result =
        await getProductPrices(
          "samsung-galaxy-s25",
        );

      expect(result).toHaveLength(0);
    });

    it("throws when product does not exist", async () => {
      vi.mocked(
        prisma.product.findUnique,
      ).mockResolvedValue(null);

      await expect(
        getProductPrices(
          "does-not-exist",
        ),
      ).rejects.toThrow(
        "Product not found",
      );
    });
  });

  describe("getProductPriceHistory", () => {
    it("returns all historical observations", async () => {
      vi.mocked(
        prisma.product.findUnique,
      ).mockResolvedValue({
        id: "product-1",
      } as any);

      vi.mocked(
        prisma.price.findMany,
      ).mockResolvedValue([
        {
          id: "price-2",
          amount: 47999,
          recordedAt: new Date(
            "2026-09-15",
          ),
        },
        {
          id: "price-1",
          amount: 49999,
          recordedAt: new Date(
            "2026-09-14",
          ),
        },
      ] as any);

      const result =
        await getProductPriceHistory(
          "samsung-galaxy-s25",
        );

      expect(result).toHaveLength(2);

      expect(
        prisma.price.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            productId: "product-1",
          },
        }),
      );
    });
  });

  describe("getBestPrice", () => {
    it("returns the lowest CURRENT price, not the historical lowest price", async () => {
      vi.mocked(
        prisma.product.findUnique,
      ).mockResolvedValue({
        id: "product-1",
      } as any);

      vi.mocked(
        prisma.price.findMany,
      ).mockResolvedValue([
        {
          id: "flipkart-latest",
          sellerId: "flipkart",
          variantId: "variant-1",
          amount: 75999,
          inStock: true,
          recordedAt: new Date(
            "2026-09-10",
          ),
          seller: {
            id: "flipkart",
            name: "Flipkart",
          },
          variant: {
            id: "variant-1",
          },
        },
        {
          id: "flipkart-old",
          sellerId: "flipkart",
          variantId: "variant-1",
          amount: 69999,
          inStock: true,
          recordedAt: new Date(
            "2026-09-08",
          ),
          seller: {
            id: "flipkart",
            name: "Flipkart",
          },
          variant: {
            id: "variant-1",
          },
        },
        {
          id: "amazon-latest",
          sellerId: "amazon",
          variantId: "variant-1",
          amount: 74999,
          inStock: true,
          recordedAt: new Date(
            "2026-09-10",
          ),
          seller: {
            id: "amazon",
            name: "Amazon",
          },
          variant: {
            id: "variant-1",
          },
        },
      ] as any);

      const result =
        await getBestPrice(
          "samsung-galaxy-s25",
        );

      expect(result).not.toBeNull();

      expect(
        Number(result?.amount),
      ).toBe(74999);

      expect(
        result?.seller?.name,
      ).toBe("Amazon");
    });

    it("returns null when no current seller has stock", async () => {
      vi.mocked(
        prisma.product.findUnique,
      ).mockResolvedValue({
        id: "product-1",
      } as any);

      vi.mocked(
        prisma.price.findMany,
      ).mockResolvedValue([
        {
          id: "latest",
          sellerId: "flipkart",
          variantId: "variant-1",
          amount: 75999,
          inStock: false,
          recordedAt: new Date(
            "2026-09-10",
          ),
        },
      ] as any);

      const result =
        await getBestPrice(
          "samsung-galaxy-s25",
        );

      expect(result).toBeNull();
    });
  });

  describe("getPriceStatistics", () => {
    it("calculates historical statistics and current price separately", async () => {
      vi.mocked(
        prisma.product.findUnique,
      ).mockResolvedValue({
        id: "product-1",
      } as any);

      vi.mocked(
        prisma.price.findMany,
      )
        .mockResolvedValueOnce([
          {
            amount: 69999,
            currency: "INR",
            inStock: true,
            recordedAt: new Date(
              "2026-09-08",
            ),
          },
          {
            amount: 74999,
            currency: "INR",
            inStock: true,
            recordedAt: new Date(
              "2026-09-10",
            ),
          },
          {
            amount: 79999,
            currency: "INR",
            inStock: true,
            recordedAt: new Date(
              "2026-09-09",
            ),
          },
        ] as any)
        .mockResolvedValueOnce([
          {
            amount: 74999,
            currency: "INR",
            inStock: true,
            sellerId: "amazon",
            variantId: "variant-1",
            recordedAt: new Date(
              "2026-09-10",
            ),
          },
          {
            amount: 75999,
            currency: "INR",
            inStock: true,
            sellerId: "flipkart",
            variantId: "variant-1",
            recordedAt: new Date(
              "2026-09-10",
            ),
          },
        ] as any);

      const result =
        await getPriceStatistics(
          "samsung-galaxy-s25",
        );

      expect(result).toEqual({
        current: 74999,
        lowest: 69999,
        highest: 79999,
        average: 74999,
        currency: "INR",
      });
    });

    it("returns null when there is no price history", async () => {
      vi.mocked(
        prisma.product.findUnique,
      ).mockResolvedValue({
        id: "product-1",
      } as any);

      vi.mocked(
        prisma.price.findMany,
      ).mockResolvedValueOnce(
        [],
      );

      const result =
        await getPriceStatistics(
          "samsung-galaxy-s25",
        );

      expect(result).toBeNull();
    });
  });
});