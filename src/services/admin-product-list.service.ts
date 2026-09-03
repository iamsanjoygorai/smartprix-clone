import prisma from "../db/prisma";

export const getAdminProducts = async () => {
  return prisma.product.findMany({
    include: {
      brand: true,
      category: true,
      images: true,
      prices: {
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
};