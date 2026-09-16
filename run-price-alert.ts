import { runPriceAlertJobWithPrisma } from "./src/modules/price-alert/price-alert.job";
import prisma from "./src/db/prisma";

runPriceAlertJobWithPrisma(prisma)
  .then(async (result) => {
    console.log(JSON.stringify(result, null, 2));
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
