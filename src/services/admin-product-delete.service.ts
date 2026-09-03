import prisma from "../db/prisma";

export const deleteAdminProduct = async (productId: string) => {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (!product.isActive) {
    throw new Error("Product is already inactive");
  }

  return prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      isActive: false,
    },
  });
};