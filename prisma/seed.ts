import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ─────────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────────

  const mobiles = await prisma.category.upsert({
    where: { slug: "mobiles" },
    update: {},
    create: {
      name: "Mobiles",
      slug: "mobiles",
      description: "Mobile phones and smartphones",
    },
  });

  const laptops = await prisma.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: {
      name: "Laptops",
      slug: "laptops",
      description: "Laptops and notebooks",
    },
  });

  // ─────────────────────────────────────────────
  // BRANDS
  // ─────────────────────────────────────────────

  const samsung = await prisma.brand.upsert({
    where: { slug: "samsung" },
    update: {},
    create: {
      name: "Samsung",
      slug: "samsung",
    },
  });

  const apple = await prisma.brand.upsert({
    where: { slug: "apple" },
    update: {},
    create: {
      name: "Apple",
      slug: "apple",
    },
  });

  const oneplus = await prisma.brand.upsert({
    where: { slug: "oneplus" },
    update: {},
    create: {
      name: "OnePlus",
      slug: "oneplus",
    },
  });

  const lenovo = await prisma.brand.upsert({
    where: { slug: "lenovo" },
    update: {},
    create: {
      name: "Lenovo",
      slug: "lenovo",
    },
  });

  // ─────────────────────────────────────────────
  // SELLERS
  // ─────────────────────────────────────────────

  const amazon = await prisma.seller.upsert({
    where: { slug: "amazon" },
    update: {},
    create: {
      name: "Amazon",
      slug: "amazon",
      websiteUrl: "https://www.amazon.in",
    },
  });

  const flipkart = await prisma.seller.upsert({
    where: { slug: "flipkart" },
    update: {},
    create: {
      name: "Flipkart",
      slug: "flipkart",
      websiteUrl: "https://www.flipkart.com",
    },
  });

  // ─────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────

  const galaxyS25 = await prisma.product.upsert({
    where: { slug: "samsung-galaxy-s25" },
    update: {},
    create: {
      name: "Samsung Galaxy S25",
      slug: "samsung-galaxy-s25",
      description: "Samsung flagship smartphone with a premium design.",
      shortDescription: "Premium Samsung smartphone",
      categoryId: mobiles.id,
      brandId: samsung.id,
      releaseDate: new Date("2025-02-01"),
    },
  });

  const iphone16 = await prisma.product.upsert({
    where: { slug: "apple-iphone-16" },
    update: {},
    create: {
      name: "Apple iPhone 16",
      slug: "apple-iphone-16",
      description: "Apple smartphone featuring the latest generation hardware.",
      shortDescription: "Next-generation iPhone",
      categoryId: mobiles.id,
      brandId: apple.id,
      releaseDate: new Date("2024-09-20"),
    },
  });

  const oneplus13 = await prisma.product.upsert({
    where: { slug: "oneplus-13" },
    update: {},
    create: {
      name: "OnePlus 13",
      slug: "oneplus-13",
      description: "High-performance OnePlus flagship smartphone.",
      shortDescription: "Powerful OnePlus flagship",
      categoryId: mobiles.id,
      brandId: oneplus.id,
      releaseDate: new Date("2025-01-10"),
    },
  });

  const lenovoIdeaPad = await prisma.product.upsert({
    where: { slug: "lenovo-ideapad-slim-5" },
    update: {},
    create: {
      name: "Lenovo IdeaPad Slim 5",
      slug: "lenovo-ideapad-slim-5",
      description: "Slim everyday laptop for work, study and entertainment.",
      shortDescription: "Slim everyday laptop",
      categoryId: laptops.id,
      brandId: lenovo.id,
    },
  });

  // ─────────────────────────────────────────────
  // PRODUCT VARIANTS
  // ─────────────────────────────────────────────

  const s25Variant = await prisma.productVariant.upsert({
    where: { sku: "S25-256-BLK" },
    update: {},
    create: {
      productId: galaxyS25.id,
      name: "Galaxy S25 12GB/256GB",
      sku: "S25-256-BLK",
      color: "Black",
      storage: "256GB",
      ram: "12GB",
    },
  });

  const iphoneVariant = await prisma.productVariant.upsert({
    where: { sku: "IP16-128-BLK" },
    update: {},
    create: {
      productId: iphone16.id,
      name: "iPhone 16 128GB",
      sku: "IP16-128-BLK",
      color: "Black",
      storage: "128GB",
    },
  });

  const oneplusVariant = await prisma.productVariant.upsert({
    where: { sku: "OP13-256-BLK" },
    update: {},
    create: {
      productId: oneplus13.id,
      name: "OnePlus 13 12GB/256GB",
      sku: "OP13-256-BLK",
      color: "Black",
      storage: "256GB",
      ram: "12GB",
    },
  });

  // ─────────────────────────────────────────────
  // PRICES
  // ─────────────────────────────────────────────

  await prisma.price.createMany({
    data: [
      {
        productId: galaxyS25.id,
        variantId: s25Variant.id,
        sellerId: amazon.id,
        amount: 74999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.amazon.in",
      },
      {
        productId: galaxyS25.id,
        variantId: s25Variant.id,
        sellerId: flipkart.id,
        amount: 73999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.flipkart.com",
      },
      {
        productId: iphone16.id,
        variantId: iphoneVariant.id,
        sellerId: amazon.id,
        amount: 69999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.amazon.in",
      },
      {
        productId: iphone16.id,
        variantId: iphoneVariant.id,
        sellerId: flipkart.id,
        amount: 67999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.flipkart.com",
      },
      {
        productId: oneplus13.id,
        variantId: oneplusVariant.id,
        sellerId: amazon.id,
        amount: 69999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.amazon.in",
      },
      {
        productId: oneplus13.id,
        variantId: oneplusVariant.id,
        sellerId: flipkart.id,
        amount: 68999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.flipkart.com",
      },
      {
        productId: lenovoIdeaPad.id,
        sellerId: amazon.id,
        amount: 64990,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.amazon.in",
      },
    ],
  });

  console.log("✅ Database seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });