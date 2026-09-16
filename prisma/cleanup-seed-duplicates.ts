import prisma from "../src/db/prisma";
import type { Prisma } from "@prisma/client";

import {
  isKnownSeedTimestamp,
  selectPriceRowsForCleanup,
} from "./cleanup-seed-duplicates.logic";

import { canDeleteSeedDuplicates } from "./cleanup-seed-duplicates.safety";

import { isDeletionSnapshotSafe } from "./cleanup-seed-duplicates.transaction";

const displayValues = [
  "6.2-inch AMOLED 120Hz",
  "6.1-inch OLED 60Hz",
  "6.82-inch AMOLED 120Hz",
];

const priceFixtures = [
  {
    productId: "cmtn6ybzd000bimgs9g2y3yds",
    variantId: "cmtn6ybzn000jimgsccblnn16",
    sellerId: "cmtn6ybz50007imgskw51dee5",
    amount: 67999,
    productUrl: "https://www.flipkart.com",
  },
  {
    productId: "cmtn6ybz70009imgsen1zdwx6",
    variantId: "cmtn6ybzj000himgs1ru4ne56",
    sellerId: "cmtn6ybz10006imgswxzorh9y",
    amount: 74999,
    productUrl: "https://www.amazon.in",
  },
  {
    productId: "cmtn6ybzf000dimgs6u9o7360",
    variantId: "cmtn6ybzp000limgsqtpeylvq",
    sellerId: "cmtn6ybz50007imgskw51dee5",
    amount: 68999,
    productUrl: "https://www.flipkart.com",
  },
  {
    productId: "cmtn6ybzf000dimgs6u9o7360",
    variantId: "cmtn6ybzp000limgsqtpeylvq",
    sellerId: "cmtn6ybz10006imgswxzorh9y",
    amount: 69999,
    productUrl: "https://www.amazon.in",
  },
  {
    productId: "cmtn6ybzh000fimgsf4y8filh",
    variantId: null,
    sellerId: "cmtn6ybz10006imgswxzorh9y",
    amount: 64990,
    productUrl: "https://www.amazon.in",
  },
  {
    productId: "cmtn6ybz70009imgsen1zdwx6",
    variantId: "cmtn6ybzj000himgs1ru4ne56",
    sellerId: "cmtn6ybz50007imgskw51dee5",
    amount: 73999,
    productUrl: "https://www.flipkart.com",
  },
  {
    productId: "cmtn6ybzd000bimgs9g2y3yds",
    variantId: "cmtn6ybzn000jimgsccblnn16",
    sellerId: "cmtn6ybz10006imgswxzorh9y",
    amount: 69999,
    productUrl: "https://www.amazon.in",
  },
];

async function getPriceCleanupRows(
  client: Prisma.TransactionClient,
) {
  const rowsToDelete: {
    id: string;
    recordedAt: Date;
  }[] = [];

  for (const fixture of priceFixtures) {
    const rows = await client.price.findMany({
      where: {
        productId: fixture.productId,
        variantId: fixture.variantId,
        sellerId: fixture.sellerId,
        amount: fixture.amount,
        currency: "INR",
        inStock: true,
        productUrl: fixture.productUrl,
      },
      select: {
        id: true,
        recordedAt: true,
      },
      orderBy: {
        recordedAt: "asc",
      },
    });

    const seedRows = rows.filter((row) =>
      isKnownSeedTimestamp(row.recordedAt),
    );

    const result = selectPriceRowsForCleanup(seedRows);

    rowsToDelete.push(...result.delete);
  }

  return rowsToDelete;
}

async function main() {
  console.log("🔍 Preparing seed duplicate cleanup...\n");

  const dryRun = process.env.DRY_RUN !== "false";
  const confirmDelete = process.env.CONFIRM_DELETE === "true";

  const deletionAllowed = canDeleteSeedDuplicates(
    dryRun,
    confirmDelete,
  );

  console.log("Cleanup mode:");
  console.log(`  DRY_RUN: ${dryRun}`);
  console.log(`  CONFIRM_DELETE: ${confirmDelete}`);
  console.log(`  DELETE ALLOWED: ${deletionAllowed}`);

  /*
   * ============================================================
   * SPECIFICATION DUPLICATE AUDIT
   * ============================================================
   *
   * We intentionally do NOT delete specifications in this cleanup.
   * They will be handled separately after their own safety checks.
   */

  console.log("\n==============================");
  console.log("SPECIFICATION DUPLICATE AUDIT");
  console.log("==============================");

  let unusedSpecificationRows = 0;

  for (const displayValue of displayValues) {
    const rows = await prisma.specificationValue.findMany({
      where: {
        value: displayValue,
      },
      select: {
        id: true,
        value: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    const unusedRows = rows.filter(
      (row) => row._count.products === 0,
    );

    unusedSpecificationRows += unusedRows.length;

    console.log(`\nSpecification value: ${displayValue}`);
    console.log(`Total rows: ${rows.length}`);
    console.log(`Referenced rows: ${rows.length - unusedRows.length}`);
    console.log(`Unused rows: ${unusedRows.length}`);

    for (const row of unusedRows) {
      console.log("Unused duplicate candidate:", {
        id: row.id,
        value: row.value,
      });
    }
  }

  console.log(
    `\nSpecification rows currently eligible for separate cleanup: ${unusedSpecificationRows}`,
  );

  /*
   * ============================================================
   * PRICE DUPLICATE AUDIT
   * ============================================================
   */

  console.log("\n==============================");
  console.log("PRICE DUPLICATE AUDIT");
  console.log("==============================");

  const plannedPriceRows = [];

  for (const fixture of priceFixtures) {
    const rows = await prisma.price.findMany({
      where: {
        productId: fixture.productId,
        variantId: fixture.variantId,
        sellerId: fixture.sellerId,
        amount: fixture.amount,
        currency: "INR",
        inStock: true,
        productUrl: fixture.productUrl,
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
      orderBy: {
        recordedAt: "asc",
      },
    });

    const seedRows = rows.filter((row) =>
      isKnownSeedTimestamp(row.recordedAt),
    );

    const result = selectPriceRowsForCleanup(seedRows);

    console.log("\nFixture:");
    console.log(fixture);

    console.log(`Total matching rows: ${rows.length}`);
    console.log(`Confirmed seed rows: ${seedRows.length}`);

    if (result.keep) {
      console.log("Seed row to KEEP:", {
        id: result.keep.id,
        recordedAt: result.keep.recordedAt,
      });
    } else {
      console.log("Seed row to KEEP: none");
    }

    console.log(
      `Seed rows to DELETE: ${result.delete.length}`,
    );

    for (const row of result.delete) {
      console.log("Delete candidate:", {
        id: row.id,
        recordedAt: row.recordedAt,
      });

      plannedPriceRows.push(row);
    }
  }

  const plannedPriceIds = plannedPriceRows.map(
    (row) => row.id,
  );

  console.log("\n==============================");
  console.log("CLEANUP PLAN");
  console.log("==============================");

  console.log(
    `Price rows planned for deletion: ${plannedPriceIds.length}`,
  );

  /*
   * ============================================================
   * DRY RUN
   * ============================================================
   */

  if (!deletionAllowed) {
    console.log("\n⚠️ DRY RUN / PROTECTED MODE");
    console.log("No database records were deleted.");
    console.log(
      `Price rows that would be deleted: ${plannedPriceIds.length}`,
    );

    await prisma.$disconnect();
    return;
  }

  /*
   * ============================================================
   * PROTECTED TRANSACTION
   * ============================================================
   */

  console.log("\n==============================");
  console.log("STARTING PROTECTED DELETION");
  console.log("==============================");

  console.log(
    "⚠️ Explicit deletion confirmation detected.",
  );

  const deletedCount = await prisma.$transaction(
    async (tx) => {
      /*
       * Re-read the database INSIDE the transaction.
       *
       * This protects us from deleting the original plan if
       * something changed between the audit and deletion.
       */

      const freshRows = await getPriceCleanupRows(tx);

      const freshIds = freshRows.map(
        (row) => row.id,
      );

      const snapshotSafe = isDeletionSnapshotSafe(
        plannedPriceIds,
        freshRows,
      );

      if (!snapshotSafe) {
        throw new Error(
          [
            "❌ CLEANUP ABORTED: database state changed.",
            `Original planned IDs: ${plannedPriceIds.length}`,
            `Fresh verified IDs: ${freshIds.length}`,
            "No Price rows were deleted.",
          ].join("\n"),
        );
      }

      console.log(
        `✅ Transaction verification passed: ${freshIds.length} rows`,
      );

      if (freshIds.length === 0) {
        console.log(
          "Nothing needs to be deleted.",
        );

        return 0;
      }

      const deleteResult = await tx.price.deleteMany({
        where: {
          id: {
            in: freshIds,
          },
        },
      });

      if (deleteResult.count !== freshIds.length) {
        throw new Error(
          [
            "❌ CLEANUP ABORTED: deleted row count mismatch.",
            `Expected: ${freshIds.length}`,
            `Deleted: ${deleteResult.count}`,
          ].join("\n"),
        );
      }

      console.log(
        `✅ Deleted exactly ${deleteResult.count} Price rows.`,
      );

      return deleteResult.count;
    },
  );

  console.log("\n==============================");
  console.log("CLEANUP COMPLETE");
  console.log("==============================");

  console.log(
    `✅ Price rows deleted: ${deletedCount}`,
  );

  console.log(
    "ℹ️ Specification duplicates were NOT deleted.",
  );

  await prisma.$disconnect();
}

main()
  .catch(async (error) => {
    console.error("\n❌ Cleanup failed.");
    console.error(error);

    await prisma.$disconnect();

    process.exit(1);
  });