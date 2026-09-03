import prisma from "../db/prisma";
import type { CreateProductInput } from "../validators/product.validator";

export const createAdminProduct = async (
  input: CreateProductInput,
) => {
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

  const brand = await prisma.brand.findUnique({
    where: { slug: brandSlug },
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const seller = await prisma.seller.findUnique({
    where: { slug: sellerSlug },
  });

  if (!seller) {
    throw new Error("Seller not found");
  }

  const slug = `${name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now()}`;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name,
        slug,
        description,
        brandId: brand.id,
        categoryId: category.id,
        isActive: true,
      },
    });

    if (image) {
      await tx.productImage.create({
        data: {
          productId: product.id,
          url: image,
          sortOrder: 0,
        },
      });
    }

    await tx.price.create({
      data: {
        productId: product.id,
        sellerId: seller.id,
        amount: price,
        currency: "INR",
        inStock: true,
      },
    });

    for (const [specificationSlug, specificationValue] of Object.entries(
      specifications,
    )) {
      const specification = await tx.specification.findUnique({
        where: {
          slug: specificationSlug,
        },
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
          productId: product.id,
          specificationId: specification.id,
          valueId: value.id,
        },
      });
    }

    return tx.product.findUnique({
      where: {
        id: product.id,
      },
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