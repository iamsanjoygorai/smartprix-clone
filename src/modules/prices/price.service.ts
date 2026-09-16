import prisma from "../../db/prisma";

import type { PriceStatistics } from "./price.types";

const getProductIdBySlug = async (
  slug: string,
): Promise<string> => {
  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product.id;
};

/**
 * Returns the latest price observation for each
 * seller + variant combination.
 *
 * Important:
 * Price records are historical observations.
 * Therefore, we cannot simply use:
 *
 *   ORDER BY amount ASC
 *
 * because that could return an old historical low.
 */
const getCurrentPriceRecords = async (
  productId: string,
) => {
  const prices = await prisma.price.findMany({
    where: {
      productId,
    },
    include: {
      seller: true,
      variant: true,
    },
    orderBy: [
      {
        recordedAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });

  const latestBySellerAndVariant = new Map<
    string,
    (typeof prices)[number]
  >();

  for (const price of prices) {
    const key = `${price.sellerId}:${
      price.variantId ?? "base"
    }`;

    if (!latestBySellerAndVariant.has(key)) {
      latestBySellerAndVariant.set(key, price);
    }
  }

  return Array.from(
    latestBySellerAndVariant.values(),
  );
};

/**
 * Current prices only.
 *
 * Returns the latest observation for each
 * seller + variant where that latest observation
 * is currently in stock.
 */
export const getProductPrices = async (
  slug: string,
) => {
  const productId =
    await getProductIdBySlug(slug);

  const currentPrices =
    await getCurrentPriceRecords(productId);

  return currentPrices
    .filter((price) => price.inStock)
    .sort(
      (a, b) =>
        Number(a.amount) - Number(b.amount),
    );
};

/**
 * Complete historical price observations.
 *
 * Nothing is deduplicated here.
 */
export const getProductPriceHistory = async (
  slug: string,
) => {
  const productId =
    await getProductIdBySlug(slug);

  return prisma.price.findMany({
    where: {
      productId,
    },
    include: {
      seller: true,
      variant: true,
    },
    orderBy: [
      {
        recordedAt: "desc",
      },
      {
        id: "desc",
      },
    ],
  });
};

/**
 * Returns the lowest CURRENT price.
 *
 * It never selects an old historical price simply
 * because that price was cheaper.
 */
export const getBestPrice = async (
  slug: string,
) => {
  const productId =
    await getProductIdBySlug(slug);

  const currentPrices =
    await getCurrentPriceRecords(productId);

  const inStockPrices = currentPrices
    .filter((price) => price.inStock)
    .sort(
      (a, b) =>
        Number(a.amount) - Number(b.amount),
    );

  return inStockPrices[0] ?? null;
};

/**
 * Historical price statistics + current market price.
 *
 * lowest  = lowest historical observation
 * highest = highest historical observation
 * average = average of historical observations
 * current = lowest price among current seller/variant prices
 */
export const getPriceStatistics = async (
  slug: string,
): Promise<PriceStatistics | null> => {
  const productId =
    await getProductIdBySlug(slug);

  const prices = await prisma.price.findMany({
    where: {
      productId,
    },
    select: {
      amount: true,
      currency: true,
      inStock: true,
      recordedAt: true,
    },
    orderBy: [
      {
        recordedAt: "desc",
      },
    ],
  });

  if (prices.length === 0) {
    return null;
  }

  const numericPrices = prices.map(
    (price) => Number(price.amount),
  );

  const lowest = Math.min(
    ...numericPrices,
  );

  const highest = Math.max(
    ...numericPrices,
  );

  const average =
    numericPrices.reduce(
      (sum, price) => sum + price,
      0,
    ) / numericPrices.length;

  const currentPrices =
    await getCurrentPriceRecords(productId);

  const currentInStockPrices =
    currentPrices
      .filter((price) => price.inStock)
      .map((price) => Number(price.amount));

  const latestPrice = prices[0];

  if (!latestPrice) {
    return null;
  }

  const current =
    currentInStockPrices.length > 0
      ? Math.min(...currentInStockPrices)
      : Number(latestPrice.amount);

  return {
    current,
    lowest,
    highest,
    average: Number(
      average.toFixed(2),
    ),
    currency:
      latestPrice.currency ?? "INR",
  };
};