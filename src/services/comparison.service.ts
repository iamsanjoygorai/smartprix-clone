import prisma from "../db/prisma";


export const getComparisonProducts = async (
  productIds: string[],
) => {
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
      isActive: true,
    },
    include: {
      brand: true,
      category: true,
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
      specifications: {
        include: {
          specification: true,
          value: true,
        },
      },
      prices: {
        where: {
          inStock: true,
        },
        include: {
          seller: true,
        },
        orderBy: {
          amount: "asc",
        },
      },
    },
  });

  return productIds
    .map((productId) =>
      products.find((product) => product.id === productId),
    )
    .filter((product) => product !== undefined)
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
      images: product.images,
      specifications: product.specifications,
      prices: product.prices,
      lowestPrice: product.prices[0]?.amount ?? null,
    }));
};

export const buildSpecificationComparison = (
  products: Awaited<ReturnType<typeof getComparisonProducts>>,
) => {
  const specificationMap = new Map<
    string,
    {
      name: string;
      unit: string | null;
      values: Record<string, string | null>;
    }
  >();

  for (const product of products) {
    for (const item of product.specifications) {
      const specificationName = item.specification.name;

      if (!specificationMap.has(specificationName)) {
        specificationMap.set(specificationName, {
          name: specificationName,
          unit: item.specification.unit,
          values: {},
        });
      }

      const specification = specificationMap.get(specificationName);

      if (!specification) {
        continue;
      }

      specification.values[product.slug] =
        item.value?.value ?? item.customValue ?? null;
    }
  }

  for (const specification of specificationMap.values()) {
    for (const product of products) {
      if (!(product.slug in specification.values)) {
        specification.values[product.slug] = null;
      }
    }
  }

  return Array.from(specificationMap.values());
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
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      variants: true,
      specifications: {
        include: {
          specification: true,
          value: true,
        },
      },
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
      reviews: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
};