import type { TriggeredPriceAlert } from "./notifications/price-alert.notification";
import type { PrismaClient } from "@prisma/client";

/**
 * Determines whether a price alert should be triggered.
 *
 * The alert triggers when the current price is
 * equal to or lower than the user's target price.
 */
export const shouldTriggerPriceAlert = (
  currentPrice: number,
  targetPrice: number,
): boolean => {
  return currentPrice <= targetPrice;
};

/**
 * Finds the lowest price among products that are currently in stock.
 *
 * Returns null when there are no in-stock prices.
 */
export const getLowestInStockPrice = (
  prices: Array<{
    amount: number;
    inStock: boolean;
  }>,
): number | null => {
  const inStockPrices = prices
    .filter((price) => price.inStock)
    .map((price) => price.amount);

  if (inStockPrices.length === 0) {
    return null;
  }

  return Math.min(...inStockPrices);
};

type PriceAlertPrisma = Pick<
  PrismaClient,
  "priceAlert"
>;

export type ProcessPriceAlertsResult = {
  processed: number;
  triggered: number;
  triggeredAlerts: TriggeredPriceAlert[];
};

/**
 * Processes a single price alert.
 */
export const processPriceAlert = async (
  prisma: PriceAlertPrisma,
  alertId: string,
): Promise<{
  triggered: boolean;
  alert?: TriggeredPriceAlert;
}> => {
  const alerts = await prisma.priceAlert.findMany({
    where: {
      id: alertId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      product: {
        select: {
          name: true,
          slug: true,
          prices: true,
        },
      },
    },
  });

  const alert = alerts[0];

  if (!alert) {
    return { triggered: false };
  }

  const prices = alert.product.prices.map((price: any) => ({
    amount: Number(price.amount),
    inStock: price.inStock,
  }));

  const lowestPrice = getLowestInStockPrice(prices);

  if (lowestPrice === null) {
    return { triggered: false };
  }

  const targetPrice = Number(alert.targetPrice);

  if (!shouldTriggerPriceAlert(lowestPrice, targetPrice)) {
    return { triggered: false };
  }

  const result = await prisma.priceAlert.updateMany({
    where: {
      id: alert.id,
      isActive: true,
    },
    data: {
      isActive: false,
      triggeredAt: new Date(),
    },
  });

  if (result.count !== 1) {
    return { triggered: false };
  }

  return {
    triggered: true,
    alert: {
      alertId: alert.id,
      userId: alert.user.id,
      email: alert.user.email,
      productName: alert.product.name,
      productSlug: alert.product.slug,
      targetPrice,
      currentPrice: lowestPrice,
      currency: alert.currency,
    },
  };
};

/**
 * Processes all currently active price alerts.
 */
export const processActivePriceAlerts = async (
  prisma: PriceAlertPrisma,
): Promise<ProcessPriceAlertsResult> => {
  const activeAlerts = await prisma.priceAlert.findMany({
    where: {
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      product: {
        select: {
          name: true,
          slug: true,
          prices: true,
        },
      },
    },
  });

  const triggeredAlerts: TriggeredPriceAlert[] = [];

  for (const alert of activeAlerts) {
    const prices = alert.product.prices.map((price: any) => ({
      amount: Number(price.amount),
      inStock: price.inStock,
    }));

    const lowestPrice = getLowestInStockPrice(prices);

    if (lowestPrice === null) {
      continue;
    }

    const targetPrice = Number(alert.targetPrice);

    if (!shouldTriggerPriceAlert(lowestPrice, targetPrice)) {
      continue;
    }

    const result = await prisma.priceAlert.updateMany({
      where: {
        id: alert.id,
        isActive: true,
      },
      data: {
        isActive: false,
        triggeredAt: new Date(),
      },
    });

    if (result.count !== 1) {
      continue;
    }

    triggeredAlerts.push({
      alertId: alert.id,
      userId: alert.user.id,
      email: alert.user.email,
      productName: alert.product.name,
      productSlug: alert.product.slug,
      targetPrice,
      currentPrice: lowestPrice,
      currency: alert.currency,
    });
  }

  return {
    processed: activeAlerts.length,
    triggered: triggeredAlerts.length,
    triggeredAlerts,
  };
};