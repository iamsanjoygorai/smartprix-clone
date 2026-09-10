import prisma from "../lib/prisma";

/* =========================================================
   TYPES
========================================================= */

interface SearchProductSuggestion {
  id: string;
  name: string;
  slug: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  image: string | null;
}

interface SearchBrandSuggestion {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface SearchCategorySuggestion {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

/* =========================================================
   NORMALIZE SEARCH
========================================================= */

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/* =========================================================
   GET SEARCH SUGGESTIONS
========================================================= */

export const getSearchSuggestions = async (query: string) => {
  const search = normalizeSearchText(query);

  if (!search) {
    return {
      products: [],
      brands: [],
      categories: [],
      popular: [],
    };
  }

  /*
   * Escape characters used by Prisma's contains search.
   */
  const searchVariants = [
    search,
    search.replace(/[^a-z0-9\s]/gi, ""),
  ].filter(Boolean);

  const primarySearch = searchVariants[0];

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const productsRaw = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        {
          name: {
            contains: primarySearch,
            mode: "insensitive",
          },
        },
        {
          brand: {
            name: {
              contains: primarySearch,
              mode: "insensitive",
            },
          },
        },
        {
          variants: {
            some: {
              OR: [
                {
                  name: {
                    contains: primarySearch,
                    mode: "insensitive",
                  },
                },
                {
                  sku: {
                    contains: primarySearch,
                    mode: "insensitive",
                  },
                },
                {
                  color: {
                    contains: primarySearch,
                    mode: "insensitive",
                  },
                },
                {
                  storage: {
                    contains: primarySearch,
                    mode: "insensitive",
                  },
                },
                {
                  ram: {
                    contains: primarySearch,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
        },
      ],
    },

    select: {
      id: true,
      name: true,
      slug: true,

      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },

      images: {
        where: {
          isPrimary: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,

        select: {
          url: true,
        },
      },
    },

    take: 12,
  });

  /* =======================================================
     PRODUCT RANKING
  ======================================================= */

  const rankedProducts = [...productsRaw]
    .map((product) => {
      const productName = product.name.toLowerCase();
      const brandName = product.brand?.name.toLowerCase() ?? "";

      let score = 0;

      // Exact product match
      if (productName === search) {
        score += 1000;
      }

      // Product starts with query
      if (productName.startsWith(search)) {
        score += 500;
      }

      // Product contains query
      if (productName.includes(search)) {
        score += 300;
      }

      // Exact brand match
      if (brandName === search) {
        score += 450;
      }

      // Brand starts with query
      if (brandName.startsWith(search)) {
        score += 250;
      }

      // Brand contains query
      if (brandName.includes(search)) {
        score += 150;
      }

      return {
        product,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ product }) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,

      brand: product.brand
        ? {
            id: product.brand.id,
            name: product.brand.name,
            slug: product.brand.slug,
          }
        : null,

      image: product.images[0]?.url ?? null,
    })) satisfies SearchProductSuggestion[];

  /* =======================================================
     BRANDS
  ======================================================= */

  const brandsRaw = await prisma.brand.findMany({
    where: {
      OR: [
        {
          name: {
            contains: primarySearch,
            mode: "insensitive",
          },
        },
        {
          slug: {
            contains: primarySearch,
            mode: "insensitive",
          },
        },
      ],
    },

    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,

      _count: {
        select: {
          products: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },

    take: 10,
  });

  const rankedBrands = [...brandsRaw]
    .map((brand) => {
      const brandName = brand.name.toLowerCase();
      const brandSlug = brand.slug.toLowerCase();

      let score = 0;

      if (brandName === search) {
        score += 1000;
      }

      if (brandName.startsWith(search)) {
        score += 500;
      }

      if (brandName.includes(search)) {
        score += 300;
      }

      if (brandSlug.includes(search)) {
        score += 150;
      }

      // Small boost for brands that actually have products
      score += Math.min(brand._count.products, 50);

      return {
        brand,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ brand }) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl,
    })) satisfies SearchBrandSuggestion[];

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categoriesRaw = await prisma.category.findMany({
    where: {
      OR: [
        {
          name: {
            contains: primarySearch,
            mode: "insensitive",
          },
        },
        {
          slug: {
            contains: primarySearch,
            mode: "insensitive",
          },
        },
      ],
    },

    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,

      _count: {
        select: {
          products: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },

    take: 10,
  });

  const rankedCategories = [...categoriesRaw]
    .map((category) => {
      const categoryName = category.name.toLowerCase();
      const categorySlug = category.slug.toLowerCase();

      let score = 0;

      if (categoryName === search) {
        score += 1000;
      }

      if (categoryName.startsWith(search)) {
        score += 500;
      }

      if (categoryName.includes(search)) {
        score += 300;
      }

      if (categorySlug.includes(search)) {
        score += 150;
      }

      score += Math.min(category._count.products, 50);

      return {
        category,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ category }) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
    })) satisfies SearchCategorySuggestion[];

  /* =======================================================
     RETURN
  ======================================================= */

  return {
    products: rankedProducts,
    brands: rankedBrands,
    categories: rankedCategories,

    /*
     * Popular searches will be connected later when we add
     * search analytics/history to the backend.
     */
    popular: [],
  };
};