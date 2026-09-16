import prisma from "../src/db/prisma";

async function main() {
  console.log("\n🔎 Inspecting duplicate seed records...\n");

  // ---------------------------------------------------------
  // DUPLICATE SPECIFICATION VALUES
  // ---------------------------------------------------------

  const duplicateValues = await prisma.specificationValue.groupBy({
    by: ["specificationId", "value"],
    _count: {
      id: true,
    },
  });

  const duplicateGroups = duplicateValues.filter(
    (row) => row._count.id > 1,
  );

  console.log("📊 SPECIFICATION VALUE DETAILS");
  console.log("================================");

  for (const group of duplicateGroups) {
    const values = await prisma.specificationValue.findMany({
      where: {
        specificationId: group.specificationId,
        value: group.value,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(`\nValue: ${group.value}`);
    console.log(`Total rows: ${values.length}`);

    for (const value of values) {
      console.log({
        id: value.id,
      productReferences: value._count.products,
      });
    }
  }

  // ---------------------------------------------------------
  // DUPLICATE PRICES
  // ---------------------------------------------------------

  const prices = await prisma.price.findMany({
    where: {
      amount: {
        in: [74999, 73999, 69999, 67999, 68999, 64990],
      },
      currency: "INR",
      inStock: true,
      productUrl: {
        in: [
          "https://www.amazon.in",
          "https://www.flipkart.com",
        ],
      },
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      productId: true,
      variantId: true,
      sellerId: true,
      amount: true,
      currency: true,
      inStock: true,
      productUrl: true,
     recordedAt: true,
    },
  });

  console.log("\n\n💰 PRICE DETAILS");
  console.log("================");

  for (const price of prices) {
    console.log(price);
  }

  console.log("\n✅ Inspection completed.\n");
}

main()
  .catch((error) => {
    console.error("❌ Inspection failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });