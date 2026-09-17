import { beforeEach, describe, expect, it, vi } from "vitest";

import prisma from "../../db/prisma";
import {
  CATEGORY_SCHEMA_SEEDS,
  seedSpecificationSchema,
  seedAllSpecificationSchemas,
} from "./specification.schema-seed";

vi.mock("../../db/prisma", () => ({
  default: {
    $transaction: vi.fn(),
    category: {
      upsert: vi.fn(),
    },
  },
}));

describe("Specification Schema Seed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("contains the four initial CMS category schemas", () => {
    expect(CATEGORY_SCHEMA_SEEDS).toHaveLength(4);

    expect(
      CATEGORY_SCHEMA_SEEDS.map((seed) => seed.category.slug),
    ).toEqual([
      "mobile-tablets",
      "laptops",
      "tv",
      "motorcycles",
    ]);
  });

  it("contains the required Mobile & Tablets specification groups", () => {
    const mobile = CATEGORY_SCHEMA_SEEDS.find(
      (seed) => seed.category.slug === "mobile-tablets",
    );

    expect(mobile).toBeDefined();

    expect(mobile!.schema.groups.map((group) => group.name)).toEqual([
      "General",
      "Design",
      "Display",
      "Memory",
      "Connectivity",
      "Performance",
      "Extra",
      "Camera",
      "Technical",
      "Multimedia",
      "Battery",
    ]);
  });

  it("contains the required Laptop specification groups", () => {
    const laptop = CATEGORY_SCHEMA_SEEDS.find(
      (seed) => seed.category.slug === "laptops",
    );

    expect(laptop).toBeDefined();

    expect(laptop!.schema.groups.map((group) => group.name)).toEqual([
      "General",
      "Display",
      "Connectivity",
      "Input",
      "Processor",
      "Graphics",
      "Memory",
      "Battery",
      "Extra",
    ]);
  });

  it("contains the required TV specification groups", () => {
    const tv = CATEGORY_SCHEMA_SEEDS.find(
      (seed) => seed.category.slug === "tv",
    );

    expect(tv).toBeDefined();

    expect(tv!.schema.groups.map((group) => group.name)).toEqual([
      "General",
      "Display",
      "Video",
      "Audio",
      "Connectivity",
      "Power Supply",
      "Smart TV Features",
    ]);
  });

  it("contains the required Motorcycle specification groups", () => {
    const motorcycle = CATEGORY_SCHEMA_SEEDS.find(
      (seed) => seed.category.slug === "motorcycles",
    );

    expect(motorcycle).toBeDefined();

    expect(
      motorcycle!.schema.groups.map((group) => group.name),
    ).toEqual([
      "General",
      "Engine and Transmission Details",
      "Performance Details",
      "Suspension and Braking Details",
      "Body Design Details",
      "Comfort and Convenience Details",
      "Safety Features",
      "Lights and Indicators",
      "Instrument Cluster Details",
    ]);
  });

  it("uses stable slugs for groups and definitions", () => {
    for (const category of CATEGORY_SCHEMA_SEEDS) {
      expect(category.schema.slug).toMatch(/^[a-z0-9-]+$/);

      for (const group of category.schema.groups) {
        expect(group.slug).toMatch(/^[a-z0-9-]+$/);

        for (const definition of group.definitions) {
          expect(definition.slug).toMatch(/^[a-z0-9-]+$/);
        }
      }
    }
  });

  it("seeds all schemas through the schema seeding service", async () => {
    const transaction = vi.fn(async (callback) => {
      return callback({
        category: {
          upsert: vi.fn().mockResolvedValue({
            id: "category-1",
          }),
        },
        specificationSchema: {
          upsert: vi.fn().mockResolvedValue({
            id: "schema-1",
          }),
        },
        specificationGroup: {
          upsert: vi.fn().mockResolvedValue({
            id: "group-1",
          }),
        },
        specificationDefinition: {
          upsert: vi.fn().mockResolvedValue({
            id: "definition-1",
          }),
        },
        specificationOption: {
          upsert: vi.fn().mockResolvedValue({
            id: "option-1",
          }),
        },
      });
    });

    vi.mocked(prisma.$transaction).mockImplementation(
      transaction as typeof prisma.$transaction,
    );

    await seedAllSpecificationSchemas();

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("rejects a seed with duplicate group slugs", async () => {
    const seed = {
      category: {
        name: "Test",
        slug: "test",
      },
      schema: {
        name: "Test Schema",
        slug: "test-schema",
        groups: [
          {
            name: "General",
            slug: "general",
            definitions: [],
          },
          {
            name: "Another General",
            slug: "general",
            definitions: [],
          },
        ],
      },
    };

    await expect(
      seedSpecificationSchema(seed),
    ).rejects.toThrow(
      "Duplicate specification group slug",
    );
  });
});