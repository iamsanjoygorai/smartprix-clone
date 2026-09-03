import prisma from "../db/prisma";

export const getProductBySlug = async (slug: string) => {
  return prisma.product.findUnique({
    where: {
      slug,
      isActive: true,
    },
    // ...
  });
};

export const getProductPrices = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: {
      slug,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    return null;
  }

  const prices = await prisma.price.findMany({
    where: {
      productId: product.id,
      inStock: true,
    },
    include: {
      seller: true,
      variant: true,
    },
    orderBy: {
      amount: "asc",
    },
  });

  return {
    prices,
    lowestPrice: prices[0]?.amount ?? null,
  };
};

export const getProductPriceHistory = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: {
      slug,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    return null;
  }

  const history = await prisma.price.findMany({
    where: {
      productId: product.id,
    },
    include: {
      seller: true,
      variant: true,
    },
    orderBy: {
      recordedAt: "asc",
    },
  });

  const lowestHistoricalPrice =
    history.length > 0
      ? history.reduce((lowest, current) =>
          current.amount.lessThan(lowest.amount) ? current : lowest,
        ).amount
      : null;

  return {
    history,
    lowestHistoricalPrice,
  };
};