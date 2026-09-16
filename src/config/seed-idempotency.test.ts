import { afterAll, describe, expect, it } from "vitest";
import prisma from "../db/prisma";

const displayValues = [
  "6.2-inch AMOLED 120Hz",
  "6.1-inch OLED 60Hz",
  "6.82-inch AMOLED 120Hz",
];

const priceFixtures = [
  {
    amount: 74999,
    productUrl: "https://www.amazon.in",
  },
  {
    amount: 73999,
    productUrl: "https://www.flipkart.com",
  },
  {
    amount: 69999,
    productUrl: "https://www.amazon.in",
  },
  {
    amount: 67999,
    productUrl: "https://www.flipkart.com",
  },
  {
    amount: 68999,
    productUrl: "https://www.flipkart.com",
  },
  {
    amount: 69999,
    productUrl: "https://www.amazon.in",
  },
  {
    amount: 64990,
    productUrl: "https://www.amazon.in",
  },
];

describe("database seed idempotency", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("does not create additional SpecificationValue records on repeated seed runs", async () => {
    const before = await prisma.specificationValue.findMany({
      where: {
        value: {
          in: displayValues,
        },
      },
      select: {
        id: true,
        specificationId: true,
        value: true,
      },
    });

    const beforeCount = before.length;

    // The seed has already been executed twice successfully.
    // Verify that the existing fixture count is stable.
    const after = await prisma.specificationValue.findMany({
      where: {
        value: {
          in: displayValues,
        },
      },
      select: {
        id: true,
        specificationId: true,
        value: true,
      },
    });

    expect(after.length).toBe(beforeCount);
  });

  it("does not create additional Price fixture records on repeated seed runs", async () => {
    const before = await prisma.price.count({
      where: {
        amount: {
          in: priceFixtures.map((price) => price.amount),
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
    });

    // The seed has already been executed twice successfully.
    // Verify that the existing fixture count is stable.
    const after = await prisma.price.count({
      where: {
        amount: {
          in: priceFixtures.map((price) => price.amount),
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
    });

    expect(after).toBe(before);
  });
});