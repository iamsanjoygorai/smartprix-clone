import { beforeEach, describe, expect, it, vi } from "vitest";

import prisma from "../../db/prisma";
import {
  findSpecificationSchemaById,
  findSpecificationSchemaBySlug,
  listSpecificationSchemas,
} from "./specification.repository";

vi.mock("../../db/prisma", () => ({
  default: {
    specificationSchema: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("Specification Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("finds a specification schema by id with its complete structure", async () => {
    const schema = {
      id: "schema-1",
      name: "Mobile & Tablets Specification Schema",
      slug: "mobile-tablets",
      category: {
        id: "category-1",
        name: "Mobile & Tablets",
        slug: "mobile-tablets",
      },
      groups: [
        {
          id: "group-1",
          name: "Display",
          slug: "display",
          definitions: [
            {
              id: "definition-1",
              name: "Refresh Rate",
              slug: "refresh-rate",
              dataType: "NUMBER",
              unit: "Hz",
              options: [],
            },
          ],
        },
      ],
    };

    vi.mocked(
      prisma.specificationSchema.findUnique,
    ).mockResolvedValue(schema as never);

    const result =
      await findSpecificationSchemaById("schema-1");

    expect(
      prisma.specificationSchema.findUnique,
    ).toHaveBeenCalledWith({
      where: {
        id: "schema-1",
      },
      include: {
        category: true,
        groups: {
          orderBy: {
            sortOrder: "asc",
          },
          include: {
            definitions: {
              orderBy: {
                sortOrder: "asc",
              },
              include: {
                options: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(result).toEqual(schema);
  });

  it("finds a specification schema by slug", async () => {
    const schema = {
      id: "schema-1",
      name: "TV Specification Schema",
      slug: "tv",
    };

    vi.mocked(
      prisma.specificationSchema.findUnique,
    ).mockResolvedValue(schema as never);

    const result =
      await findSpecificationSchemaBySlug("tv");

    expect(
      prisma.specificationSchema.findUnique,
    ).toHaveBeenCalledWith({
      where: {
        slug: "tv",
      },
      include: {
        category: true,
        groups: {
          orderBy: {
            sortOrder: "asc",
          },
          include: {
            definitions: {
              orderBy: {
                sortOrder: "asc",
              },
              include: {
                options: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    expect(result).toEqual(schema);
  });

  it("lists active specification schemas", async () => {
    const schemas = [
      {
        id: "schema-1",
        name: "Mobile & Tablets Specification Schema",
        slug: "mobile-tablets",
        isActive: true,
      },
      {
        id: "schema-2",
        name: "Laptops Specification Schema",
        slug: "laptops",
        isActive: true,
      },
    ];

    vi.mocked(
      prisma.specificationSchema.findMany,
    ).mockResolvedValue(schemas as never);

    const result =
      await listSpecificationSchemas();

    expect(
      prisma.specificationSchema.findMany,
    ).toHaveBeenCalledWith({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        category: true,
        _count: {
          select: {
            groups: true,
          },
        },
      },
    });

    expect(result).toEqual(schemas);
  });

  it("returns null when a schema does not exist", async () => {
    vi.mocked(
      prisma.specificationSchema.findUnique,
    ).mockResolvedValue(null);

    const result =
      await findSpecificationSchemaById(
        "missing-schema",
      );

    expect(result).toBeNull();
  });
});