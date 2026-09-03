import prisma from "../db/prisma";

export const getProducts = async (query: Record<string, unknown>) => {
  const search =
    typeof query.search === "string" ? query.search : undefined;

  const brand =
    typeof query.brand === "string" ? query.brand : undefined;

  const category =
    typeof query.category === "string" ? query.category : undefined;

  const minPrice =
    typeof query.minPrice === "string"
      ? Number(query.minPrice)
      : undefined;

  const maxPrice =
    typeof query.maxPrice === "string"
      ? Number(query.maxPrice)
      : undefined;

  const products = await prisma.product.findMany({
    where: {
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
    },

    include: {
      brand: true,
      category: true,
      images: true,
      prices: {
        where: {
          inStock: true,
        },
        include: {
          seller: true,
          variant: true,
        },
        orderBy: {
          amount: "asc",
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return products;
};

export const getProductBySlug = async (slug: string) => {
  return prisma.product.findUnique({
    where: {
      slug,
      isActive: true,
    },
    include: {
      brand: true,
      category: true,
      images: true,
      prices: {
        where: {
          inStock: true,
        },
        include: {
          seller: true,
          variant: true,
        },
        orderBy: {
          amount: "asc",
        },
      },
      specifications: {
        include: {
          specification: true,
          value: true,
        },
      },
    },
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
          current.amount.lessThan(lowest.amount)
            ? current
            : lowest,
        ).amount
      : null;

  return {
    history,
    lowestHistoricalPrice,
  };
};

export const getProductSpecifications = async (slug: string) => {
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

  return prisma.productSpecification.findMany({
    where: {
      productId: product.id,
    },
    include: {
      specification: true,
      value: true,
    },
    orderBy: {
      specification: {
        name: "asc",
      },
    },
  });
};