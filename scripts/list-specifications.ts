import prisma from "../src/db/prisma";

async function main() {
  const specifications = await prisma.specification.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      group: true,
      unit: true,
      dataType: true,
    },
    orderBy: [
      {
        group: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  console.log("\n==============================================");
  console.log("       ALL PRODUCT SPECIFICATIONS");
  console.log("==============================================\n");

  console.log(`Total specifications: ${specifications.length}\n`);

  for (const specification of specifications) {
    console.log(
      `${specification.name} | ${specification.slug} | ${specification.group} | ${specification.unit ?? "-"} | ${specification.dataType}`,
    );
  }

  console.log("\n==============================================\n");
}

main()
  .catch((error) => {
    console.error("Failed to load specifications:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });