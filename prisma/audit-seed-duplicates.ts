import prisma from "../src/db/prisma";

async function main() {
  console.log("\n🔍 Checking existing seed duplicates...\n");

  // ---------------------------------------------------------
  // PRICE DUPLICATES
  // ---------------------------------------------------------

  const prices = await prisma.price.groupBy({
    by: [
      "productId",
      "variantId",
      "sellerId",
      "amount",
      "currency",
      "inStock",
      "productUrl",
    ],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  const duplicatePrices = prices.filter((row) => row._count.id > 1);

  console.log("💰 PRICE DUPLICATES");
  console.log("===================");

  if (duplicatePrices.length === 0) {
    console.log("✅ No duplicate prices found.");
  } else {
    console.log(
      `⚠️ Found ${duplicatePrices.length} duplicate price groups.\n`,
    );

    for (const row of duplicatePrices) {
      console.log({
        productId: row.productId,
        variantId: row.variantId,
        sellerId: row.sellerId,
        amount: row.amount,
        currency: row.currency,
        inStock: row.inStock,
        productUrl: row.productUrl,
        count: row._count.id,
      });
    }
  }

  // ---------------------------------------------------------
  // SPECIFICATION VALUE DUPLICATES
  // ---------------------------------------------------------

  const specificationValues =
    await prisma.specificationValue.groupBy({
      by: ["specificationId", "value"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

  const duplicateSpecificationValues =
    specificationValues.filter(
      (row) => row._count.id > 1,
    );

  console.log("\n📊 SPECIFICATION VALUE DUPLICATES");
  console.log("================================");

  if (duplicateSpecificationValues.length === 0) {
    console.log("✅ No duplicate specification values found.");
  } else {
    console.log(
      `⚠️ Found ${duplicateSpecificationValues.length} duplicate specification value groups.\n`,
    );

    for (const row of duplicateSpecificationValues) {
      console.log({
        specificationId: row.specificationId,
        value: row.value,
        count: row._count.id,
      });
    }
  }

  // ---------------------------------------------------------
  // TOTAL COUNTS
  // ---------------------------------------------------------

  const priceCount = await prisma.price.count();
  const specificationValueCount =
    await prisma.specificationValue.count();

  console.log("\n📦 TOTAL COUNTS");
  console.log("===============");
  console.log(`Prices: ${priceCount}`);
  console.log(
    `Specification values: ${specificationValueCount}`,
  );

  console.log("\n✅ Audit completed.\n");
}

main()
  .catch((error) => {
    console.error("❌ Audit failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });