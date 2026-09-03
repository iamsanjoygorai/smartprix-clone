import prisma from "../db/prisma";
import type { UpdateProductInput } from "../validators/admin-product-update.validator";

export const updateAdminProduct = async (
  productId: string,
  input: UpdateProductInput,
) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const {
    name,
    description,
    brandSlug,
    categorySlug,
    image,
    price,
    sellerSlug,
    specifications,
  } = input;

  const brand = brandSlug
    ? await prisma.brand.findUnique({ where: { slug: brandSlug } })
    : null;

  if (brandSlug && !brand) {
    throw new Error("Brand not found");
  }

  const category = categorySlug
    ? await prisma.category.findUnique({ where: { slug: categorySlug } })
    : null;

  if (categorySlug && !category) {
    throw new Error("Category not found");
  }

  const seller = sellerSlug
    ? await prisma.seller.findUnique({ where: { slug: sellerSlug } })
    : null;

  if (sellerSlug && !seller) {
    throw new Error("Seller not found");
  }

  return prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(brand ? { brandId: brand.id } : {}),
        ...(category ? { categoryId: category.id } : {}),
      },
    });

    if (image !== undefined) {
      const existingImage = await tx.productImage.findFirst({
        where: { productId },
        orderBy: { sortOrder: "asc" },
      });

      if (existingImage) {
        await tx.productImage.update({
          where: { id: existingImage.id },
          data: { url: image },
        });
      } else {
        await tx.productImage.create({
          data: {
            productId,
            url: image,
            sortOrder: 0,
          },
        });
      }
    }

    if (price !== undefined || seller) {
      const existingPrice = await tx.price.findFirst({
        where: { productId },
        orderBy: { amount: "asc" },
      });

      if (existingPrice) {
        await tx.price.update({
          where: { id: existingPrice.id },
          data: {
            ...(price !== undefined ? { amount: price } : {}),
            ...(seller ? { sellerId: seller.id } : {}),
          },
        });
      } else if (seller && price !== undefined) {
        await tx.price.create({
          data: {
            productId,
            sellerId: seller.id,
            amount: price,
            currency: "INR",
            inStock: true,
          },
        });
      }
    }

    if (specifications !== undefined) {
      await tx.productSpecification.deleteMany({
        where: { productId },
      });

      for (const [specificationSlug, specificationValue] of Object.entries(
        specifications,
      )) {
        const specification = await tx.specification.findUnique({
          where: { slug: specificationSlug },
        });

        if (!specification) {
          throw new Error(
            `Specification not found: ${specificationSlug}`,
          );
        }

        let value = await tx.specificationValue.findFirst({
          where: {
            specificationId: specification.id,
            value: specificationValue,
          },
        });

        if (!value) {
          value = await tx.specificationValue.create({
            data: {
              specificationId: specification.id,
              value: specificationValue,
            },
          });
        }

        await tx.productSpecification.create({
          data: {
            productId,
            specificationId: specification.id,
            valueId: value.id,
          },
        });
      }
    }

    return tx.product.findUnique({
      where: { id: updatedProduct.id },
      include: {
        brand: true,
        category: true,
        images: true,
        specifications: {
          include: {
            specification: true,
            value: true,
          },
        },
        prices: {
          include: {
            seller: true,
          },
        },
      },
    });
  });
};