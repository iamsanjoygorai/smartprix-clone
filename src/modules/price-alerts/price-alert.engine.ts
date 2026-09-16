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

type PriceAlertPrisma = {
  priceAlert: {
    findMany: (args: unknown) => Promise<any[]>;
    updateMany: (args: unknown) => Promise<{ count: number }>;
  };
};

/**
 * Processes a single price alert.
 */
export const processPriceAlert = async (
  prisma: PriceAlertPrisma,
  alertId: string,
): Promise<{ triggered: boolean }> => {
  const alerts = await prisma.priceAlert.findMany({
    where: {
      id: alertId,
      isActive: true,
    },
    include: {
      product: {
        include: {
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

  return {
    triggered: result.count === 1,
  };
};

/**
 * Processes all currently active price alerts.
 */
export const processActivePriceAlerts = async (
  prisma: PriceAlertPrisma,
): Promise<{ processed: number; triggered: number }> => {
  const activeAlerts = await prisma.priceAlert.findMany({
    where: {
      isActive: true,
    },
    include: {
      product: {
        include: {
          prices: true,
        },
      },
    },
  });

  let triggered = 0;

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

if (result.count === 1) {
  triggered++;
}
  }

  return {
    processed: activeAlerts.length,
    triggered,
  };
};