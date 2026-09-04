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
    images,
    price,
    sellerSlug,
    specifications,
  } = input;

  const brand = await prisma.brand.findUnique({
    where: {
      slug: brandSlug,
    },
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  const category = await prisma.category.findUnique({
    where: {
      slug: categorySlug,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const seller = await prisma.seller.findUnique({
    where: {
      slug: sellerSlug,
    },
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
    /*
     * ------------------------------------------------
     * CREATE PRODUCT
     * ------------------------------------------------
     */

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

    /*
     * ------------------------------------------------
     * CREATE PRODUCT IMAGES
     * ------------------------------------------------
     */

    if (images && images.length > 0) {
      for (const [index, image] of images.entries()) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: image,
            sortOrder: index,
            isPrimary: index === 0,
          },
        });
      }
    }

    /*
     * ------------------------------------------------
     * CREATE PRODUCT PRICE
     * ------------------------------------------------
     */

    await tx.price.create({
      data: {
        productId: product.id,
        sellerId: seller.id,
        amount: price,
        currency: "INR",
        inStock: true,
      },
    });

    /*
     * ------------------------------------------------
     * CREATE PRODUCT SPECIFICATIONS
     * ------------------------------------------------
     */

    for (const [
      specificationSlug,
      specificationValue,
    ] of Object.entries(specifications ?? {})) {
      /*
       * Ignore empty values.
       */
      if (
        specificationValue === undefined ||
        specificationValue === null ||
        specificationValue === ""
      ) {
        continue;
      }

      /*
       * Find specification definition.
       */
      const specification =
        await tx.specification.findUnique({
          where: {
            slug: specificationSlug,
          },
        });

      if (!specification) {
        throw new Error(
          `Specification not found: ${specificationSlug}`,
        );
      }

      /*
       * Convert value to string because
       * SpecificationValue.value is stored as text.
       */
      const normalizedValue = String(specificationValue);

      /*
       * Check whether this specification value
       * already exists.
       */
      let value =
        await tx.specificationValue.findFirst({
          where: {
            specificationId: specification.id,
            value: normalizedValue,
          },
        });

      /*
       * Create specification value if it doesn't exist.
       */
      if (!value) {
        value =
          await tx.specificationValue.create({
            data: {
              specificationId: specification.id,
              value: normalizedValue,
            },
          });
      }

      /*
       * Create product -> specification relation.
       */
      await tx.productSpecification.create({
        data: {
          productId: product.id,
          specificationId: specification.id,
          valueId: value.id,
        },
      });
    }

    /*
     * ------------------------------------------------
     * RETURN COMPLETE PRODUCT
     * ------------------------------------------------
     */

    return tx.product.findUnique({
      where: {
        id: product.id,
      },

      include: {
        brand: true,
        category: true,

        images: {
          orderBy: {
            sortOrder: "asc",
          },
        },

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