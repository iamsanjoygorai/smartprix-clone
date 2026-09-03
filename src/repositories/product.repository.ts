import { Prisma } from "@prisma/client";

import prisma from "../db/prisma";

export const findProducts = async (
  where: Prisma.ProductWhereInput,
  skip: number,
  take: number,
  sort: string,
) => {
  const products = await prisma.product.findMany({
    where,
    include: {
      brand: true,
      category: true,
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
      prices: {
        where: {
          inStock: true,
        },
        orderBy: {
          amount: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (sort === "price_asc" || sort === "price_desc") {
    products.sort((a, b) => {
      const priceA = a.prices[0]?.amount;
      const priceB = b.prices[0]?.amount;

      if (priceA === undefined && priceB === undefined) {
        return 0;
      }

      if (priceA === undefined) {
        return 1;
      }

      if (priceB === undefined) {
        return -1;
      }

      const comparison = priceA.toNumber() - priceB.toNumber();

      return sort === "price_asc" ? comparison : -comparison;
    });
  }

  return products.slice(skip, skip + take);
};

export const countProducts = async (
  where: Prisma.ProductWhereInput,
): Promise<number> => {
  return prisma.product.count({
    where,
  });
};