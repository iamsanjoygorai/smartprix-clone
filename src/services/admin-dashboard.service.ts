import prisma from "../db/prisma";

export const getAdminDashboard = async () => {
  const [
    productCount,
    newsCount,
    userCount,
    brandCount,

    recentProducts,
    recentNews,

    draftNewsCount,
    missingImagesCount,
    missingPricesCount,
    missingSpecificationsCount,
  ] = await Promise.all([
    // Overview
    prisma.product.count({
      where: {
        isActive: true,
      },
    }),

    prisma.news.count(),

    prisma.user.count(),

    prisma.brand.count(),

    // Recent Products
    prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        brand: {
          select: {
            name: true,
          },
        },
        images: {
          where: {
            isPrimary: true,
          },
          take: 1,
          select: {
            url: true,
          },
        },
        prices: {
          where: {
            inStock: true,
          },
          orderBy: {
            amount: "asc",
          },
          take: 1,
          select: {
            amount: true,
            currency: true,
          },
        },
      },
    }),

    // Recent News
    prisma.news.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        featuredImage: true,
        createdAt: true,
        publishedAt: true,
      },
    }),

    // Draft articles
    prisma.news.count({
      where: {
        status: "DRAFT",
      },
    }),

    // Products without images
    prisma.product.count({
      where: {
        isActive: true,
        images: {
          none: {},
        },
      },
    }),

    // Products without an available price
    prisma.product.count({
      where: {
        isActive: true,
        prices: {
          none: {
            inStock: true,
          },
        },
      },
    }),

    // Products without specifications
    prisma.product.count({
      where: {
        isActive: true,
        specifications: {
          none: {},
        },
      },
    }),
  ]);

  return {
    overview: {
      products: productCount,
      news: newsCount,
      users: userCount,
      brands: brandCount,
    },

    recentProducts,

    recentNews,

    contentHealth: {
      missingImages: missingImagesCount,
      missingPrices: missingPricesCount,
      missingSpecifications: missingSpecificationsCount,
      draftArticles: draftNewsCount,
    },
  };
};