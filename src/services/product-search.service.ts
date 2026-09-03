import { Prisma } from "@prisma/client";

import {
  findProducts,
  countProducts,
} from "../repositories/product.repository";

type ProductSearchParams = {
  page: number;
  limit: number;
  search?: string;
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort: string;
};

export const searchProducts = async ({
  page,
  limit,
  search,
  brand,
  category,
  minPrice,
  maxPrice,
  sort,
}: ProductSearchParams) => {
  const where: Prisma.ProductWhereInput = {
    isActive: true,

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),

    ...(brand
      ? {
          brand: {
            slug: brand,
          },
        }
      : {}),

    ...(category
      ? {
          category: {
            slug: category,
          },
        }
      : {}),

    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          prices: {
            some: {
              inStock: true,
              amount: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
              },
            },
          },
        }
      : {}),
  };

  const products = await findProducts(
    where,
    (page - 1) * limit,
    limit,
    sort,
  );

  const total = await countProducts(where);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};