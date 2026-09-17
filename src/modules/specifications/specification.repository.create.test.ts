import { beforeEach, describe, expect, it, vi } from "vitest";

import prisma from "../../db/prisma";
import {
  createSpecificationSchemaRecord,
} from "./specification.repository";

vi.mock("../../db/prisma", () => ({
  default: {
    specificationSchema: {
      create: vi.fn(),
    },
  },
}));

describe("Specification Repository - Create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a complete specification schema structure", async () => {
    const input = {
      categoryId: "category-1",
      name: "Mobile & Tablets Specification Schema",
      slug: "mobile-tablets",
      description: "Mobile device specification schema",

      groups: {
        create: [
          {
            name: "Display",
            slug: "display",
            description: "Display specifications",
            sortOrder: 1,

            definitions: {
              create: [
                {
                  name: "Screen Size",
                  slug: "screen-size",
                  dataType: "NUMBER",
                  unit: "inch",

                  isRequired: true,
                  isFilterable: true,
                  isComparable: true,
                  isSearchable: true,

                  sortOrder: 1,

                  configuration: {
                    min: 1,
                    max: 20,
                  },

                  options: undefined,
                },
              ],
            },
          },
        ],
      },
    };

    const createdSchema = {
      id: "schema-1",
      ...input,
    };

    vi.mocked(
      prisma.specificationSchema.create,
    ).mockResolvedValue(createdSchema as never);

    const result =
      await createSpecificationSchemaRecord(input);

    expect(
      prisma.specificationSchema.create,
    ).toHaveBeenCalledWith({
      data: input,
    });

    expect(result).toEqual(createdSchema);
  });

  it("creates SELECT definitions with their options", async () => {
    const input = {
      categoryId: "category-1",
      name: "TV Specification Schema",
      slug: "tv",

      groups: {
        create: [
          {
            name: "Display",
            slug: "display",
            sortOrder: 1,

            definitions: {
              create: [
                {
                  name: "Panel Type",
                  slug: "panel-type",
                  dataType: "SELECT",
                  sortOrder: 1,

                  options: {
                    create: [
                      {
                        label: "OLED",
                        value: "oled",
                        sortOrder: 1,
                      },
                      {
                        label: "QLED",
                        value: "qled",
                        sortOrder: 2,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    };

    const createdSchema = {
      id: "schema-2",
      ...input,
    };

    vi.mocked(
      prisma.specificationSchema.create,
    ).mockResolvedValue(createdSchema as never);

    const result =
      await createSpecificationSchemaRecord(input);

    expect(
      prisma.specificationSchema.create,
    ).toHaveBeenCalledWith({
      data: input,
    });

    expect(result).toEqual(createdSchema);
  });
});