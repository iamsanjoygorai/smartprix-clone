import prisma from "../db/prisma";

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
   NORMALIZE SEARCH TEXT
========================================================= */

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export const recordSearchQuery = async (
  query: string,
) => {
  const normalized = normalizeSearchText(query);

  if (!normalized || normalized.length < 2) {
    return;
  }

  await prisma.searchQuery.upsert({
    where: {
      normalized,
    },

    update: {
      count: {
        increment: 1,
      },
      lastSearchedAt: new Date(),
    },

    create: {
      query: query.trim(),
      normalized,
      count: 1,
      lastSearchedAt: new Date(),
    },
  });
};

export const getPopularSearches = async (
  query?: string,
) => {
  const search = query
    ? normalizeSearchText(query)
    : "";

  const results = await prisma.searchQuery.findMany({
    where: search
      ? {
          normalized: {
            contains: search,
            mode: "insensitive",
          },
        }
      : undefined,

    orderBy: [
      {
        count: "desc",
      },
      {
        lastSearchedAt: "desc",
      },
    ],

    take: 8,

    select: {
      query: true,
      count: true,
    },
  });

  return results;
};

/* =========================================================
   NORMALIZE IMAGE URL
========================================================= */

function normalizeImageUrl(
  url?: string | null,
): string | null {
  if (!url) return null;

  let value = url.trim();

  if (!value) return null;

  /*
   * Convert Markdown image/link:
   *
   * [image](https://example.com/image.webp)
   */
  const markdownMatch = value.match(
    /\]\((https?:\/\/[^)]+)\)/,
  );

  if (markdownMatch?.[1]) {
    value = markdownMatch[1];
  }

  return value;
}

/* =========================================================
   TOKENIZE SEARCH
========================================================= */

function tokenize(value: string): string[] {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

/* =========================================================
   CALCULATE TEXT MATCH SCORE
========================================================= */

function getTextMatchScore(
  text: string,
  search: string,
): number {
  const normalizedText = normalizeSearchText(text);
  const normalizedSearch = normalizeSearchText(search);

  if (!normalizedText || !normalizedSearch) {
    return 0;
  }

  const searchTokens = tokenize(normalizedSearch);
  const textTokens = tokenize(normalizedText);

  let score = 0;

  /*
   * =======================================================
   * EXACT MATCH
   * =======================================================
   */

  if (normalizedText === normalizedSearch) {
    score += 10000;
  }

  /*
   * =======================================================
   * EXACT WORD MATCH
   * =======================================================
   */

  if (textTokens.includes(normalizedSearch)) {
    score += 5000;
  }

  /*
   * =======================================================
   * STARTS WITH FULL SEARCH
   * =======================================================
   */

  if (normalizedText.startsWith(normalizedSearch)) {
    score += 3500;
  }

  /*
   * =======================================================
   * STARTS WITH SEARCH AS A WORD
   * =======================================================
   */

  if (
    textTokens.some((token) =>
      token.startsWith(normalizedSearch),
    )
  ) {
    score += 2500;
  }

  /*
   * =======================================================
   * EVERY SEARCH TOKEN MATCHES
   * =======================================================
   */

  if (
    searchTokens.length > 1 &&
    searchTokens.every((searchToken) =>
      textTokens.some((textToken) =>
        textToken.startsWith(searchToken),
      ),
    )
  ) {
    score += 2200;
  }

  /*
   * =======================================================
   * TOKEN MATCHES
   * =======================================================
   */

  for (const searchToken of searchTokens) {
    if (
      textTokens.some(
        (textToken) => textToken === searchToken,
      )
    ) {
      score += 900;
    } else if (
      textTokens.some((textToken) =>
        textToken.startsWith(searchToken),
      )
    ) {
      score += 600;
    } else if (
      normalizedText.includes(searchToken)
    ) {
      score += 300;
    }
  }

  /*
   * =======================================================
   * GENERAL CONTAINS
   * =======================================================
   */

  if (normalizedText.includes(normalizedSearch)) {
    score += 500;
  }

  return score;
}

/* =========================================================
   PRODUCT SCORE
========================================================= */

function getProductScore(
  product: {
    name: string;
    brand: {
      name: string;
    } | null;
  },
  search: string,
): number {
  const productName = normalizeSearchText(
    product.name,
  );

  const brandName = normalizeSearchText(
    product.brand?.name ?? "",
  );

  let score = 0;

  /*
   * Product name is more important than brand.
   */
  score +=
    getTextMatchScore(productName, search) * 1.5;

  /*
   * Brand match gets a smaller boost.
   */
  if (brandName) {
    score +=
      getTextMatchScore(brandName, search) * 0.75;
  }

  /*
   * =======================================================
   * PRODUCT-SPECIFIC BOOSTS
   * =======================================================
   */

  const searchTokens = tokenize(search);
  const productTokens = tokenize(productName);

  /*
   * All search terms appearing in product name.
   */
  if (
    searchTokens.length > 1 &&
    searchTokens.every((token) =>
      productTokens.some((productToken) =>
        productToken.startsWith(token),
      ),
    )
  ) {
    score += 1800;
  }

  /*
   * Exact first-word match.
   *
   * Example:
   * "samsung s26"
   * should strongly prefer products beginning with Samsung.
   */
  if (
    searchTokens.length > 0 &&
    productTokens[0] === searchTokens[0]
  ) {
    score += 700;
  }

  /*
   * Slight preference for shorter names when the
   * relevance score is otherwise similar.
   */
  score -= Math.min(productTokens.length * 2, 30);

  return score;
}

/* =========================================================
   GET SEARCH SUGGESTIONS
========================================================= */

export const getSearchSuggestions = async (
  query: string,
) => {
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
   * Remove unsupported characters for the secondary
   * database search.
   */
  const cleanedSearch = search
    .replace(/[^a-z0-9\s]/gi, "")
    .trim();

  const primarySearch = search || cleanedSearch;

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const productsRaw =
    await prisma.product.findMany({
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

      /*
       * Fetch more than we display so ranking has
       * enough candidates to work with.
       */
      take: 30,
    });

  /* =======================================================
     PRODUCT RANKING
  ======================================================= */

  const rankedProducts = productsRaw
    .map((product) => ({
      product,

      score: getProductScore(
        {
          name: product.name,
          brand: product.brand,
        },
        search,
      ),
    }))

    .sort((a, b) => {
      /*
       * Highest relevance first.
       */
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      /*
       * Stable alphabetical fallback.
       */
      return a.product.name.localeCompare(
        b.product.name,
      );
    })

    .slice(0, 6)

    .map(
      ({ product }) =>
        ({
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

          image: normalizeImageUrl(
            product.images[0]?.url,
          ),
        }) satisfies SearchProductSuggestion,
    );

  /* =======================================================
     BRANDS
  ======================================================= */

  const brandsRaw =
    await prisma.brand.findMany({
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

      take: 20,
    });

  /* =======================================================
     BRAND RANKING
  ======================================================= */

  const rankedBrands = brandsRaw
    .map((brand) => {
      const nameScore = getTextMatchScore(
        brand.name,
        search,
      );

      const slugScore = getTextMatchScore(
        brand.slug,
        search,
      );

      let score =
        nameScore * 2 +
        slugScore * 0.5;

      /*
       * Brands with products get a small boost.
       */
      score += Math.min(
        brand._count.products * 2,
        100,
      );

      return {
        brand,
        score,
      };
    })

    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.brand.name.localeCompare(
        b.brand.name,
      );
    })

    .slice(0, 4)

    .map(
      ({ brand }) =>
        ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          logoUrl: brand.logoUrl,
        }) satisfies SearchBrandSuggestion,
    );

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categoriesRaw =
    await prisma.category.findMany({
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

      take: 20,
    });

  /* =======================================================
     CATEGORY RANKING
  ======================================================= */

  const rankedCategories = categoriesRaw
    .map((category) => {
      const nameScore = getTextMatchScore(
        category.name,
        search,
      );

      const slugScore = getTextMatchScore(
        category.slug,
        search,
      );

      let score =
        nameScore * 2 +
        slugScore * 0.5;

      score += Math.min(
        category._count.products * 2,
        100,
      );

      return {
        category,
        score,
      };
    })

    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.category.name.localeCompare(
        b.category.name,
      );
    })

    .slice(0, 3)

    .map(
      ({ category }) =>
        ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          imageUrl: category.imageUrl,
        }) satisfies SearchCategorySuggestion,
    );

  /* =======================================================
     RETURN
  ======================================================= */

  const popular = await getPopularSearches(search);

return {
  products: rankedProducts,
  brands: rankedBrands,
  categories: rankedCategories,
  popular,
};
};
