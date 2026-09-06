import prisma from "../db/prisma";

export const getProducts = async (
  query: Record<string, unknown>,
) => {
  // ─────────────────────────────────────────────
  // QUERY PARAMETERS
  // ─────────────────────────────────────────────

  const search =
    typeof query.search === "string" && query.search.trim()
      ? query.search.trim()
      : undefined;

  const brands =
  typeof query.brands === "string"
    ? query.brands
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const category =
    typeof query.category === "string" && query.category.trim()
      ? query.category.trim()
      : undefined;

  const minPriceValue =
    typeof query.minPrice === "string"
      ? Number(query.minPrice)
      : undefined;

  const maxPriceValue =
    typeof query.maxPrice === "string"
      ? Number(query.maxPrice)
      : undefined;

  const minPrice =
    minPriceValue !== undefined &&
    Number.isFinite(minPriceValue)
      ? minPriceValue
      : undefined;

  const maxPrice =
    maxPriceValue !== undefined &&
    Number.isFinite(maxPriceValue)
      ? maxPriceValue
      : undefined;

  // ─────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────

  const pageValue =
    typeof query.page === "string"
      ? Number(query.page)
      : 1;

  const limitValue =
    typeof query.limit === "string"
      ? Number(query.limit)
      : 20;

  const page =
    Number.isFinite(pageValue) && pageValue > 0
      ? Math.floor(pageValue)
      : 1;

  const limit =
    Number.isFinite(limitValue) &&
    limitValue > 0 &&
    limitValue <= 100
      ? Math.floor(limitValue)
      : 20;

  const skip = (page - 1) * limit;

  // ─────────────────────────────────────────────
  // SORTING
  // ─────────────────────────────────────────────

  const sort =
    typeof query.sort === "string"
      ? query.sort
      : "relevance";

  let orderBy:
    | { createdAt: "asc" | "desc" }
    | { releaseDate: "asc" | "desc" }
    | { name: "asc" | "desc" } = {
    createdAt: "desc",
  };

  switch (sort) {
    case "newest":
      orderBy = {
        releaseDate: "desc",
      };
      break;

    case "oldest":
      orderBy = {
        releaseDate: "asc",
      };
      break;

    case "name_asc":
      orderBy = {
        name: "asc",
      };
      break;

    case "name_desc":
      orderBy = {
        name: "desc",
      };
      break;

    case "relevance":
    default:
      orderBy = {
        createdAt: "desc",
      };
      break;
  }

  // ─────────────────────────────────────────────
  // WHERE
  // ─────────────────────────────────────────────

  const where = {
    isActive: true,

    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              shortDescription: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),

    ...(brands.length > 0
  ? {
      brand: {
        slug: {
          in: brands,
        },
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
                ...(minPrice !== undefined
                  ? {
                      gte: minPrice,
                    }
                  : {}),

                ...(maxPrice !== undefined
                  ? {
                      lte: maxPrice,
                    }
                  : {}),
              },
            },
          },
        }
      : {}),
  };

  // ─────────────────────────────────────────────
  // TOTAL COUNT
  // ─────────────────────────────────────────────

  const total = await prisma.product.count({
    where,
  });

  // ─────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────

  const products = await prisma.product.findMany({
    where,

    include: {
      brand: true,

      category: true,

      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },

      variants: true,

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

        orderBy: {
          specification: {
            name: "asc",
          },
        },
      },
    },

    orderBy,

    skip,
    take: limit,
  });

  // ─────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────

  const totalPages =
    total === 0
      ? 0
      : Math.ceil(total / limit);

  return {
    products,

    pagination: {
      page,
      limit,
      total,
      totalPages,

      hasNextPage:
        totalPages > 0 && page < totalPages,

      hasPreviousPage:
        page > 1 && page <= totalPages,
    },
  };
};


// ─────────────────────────────────────────────
// SINGLE PRODUCT
// ─────────────────────────────────────────────

export const getProductBySlug = async (
  slug: string,
) => {
  return prisma.product.findUnique({
    where: {
      slug,
      isActive: true,
    },

    include: {
      brand: true,

      category: true,

      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },

      variants: true,

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

        orderBy: {
          specification: {
            name: "asc",
          },
        },
      },
    },
  });
};


// ─────────────────────────────────────────────
// PRODUCT PRICES
// ─────────────────────────────────────────────

export const getProductPrices = async (
  slug: string,
) => {
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


// ─────────────────────────────────────────────
// PRICE HISTORY
// ─────────────────────────────────────────────

export const getProductPriceHistory = async (
  slug: string,
) => {
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


// ─────────────────────────────────────────────
// PRODUCT SPECIFICATIONS
// ─────────────────────────────────────────────

export const getProductSpecifications = async (
  slug: string,
) => {
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