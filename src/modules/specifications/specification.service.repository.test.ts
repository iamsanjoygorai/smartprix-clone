import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSpecificationSchema,
  type CreateSpecificationSchemaInput,
} from "./specification.service";

import * as repository from "./specification.repository";

vi.mock("./specification.repository", () => ({
  createSpecificationSchemaRecord: vi.fn(),
}));

describe("Specification Service → Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates persistence to the specification repository", async () => {
    const input: CreateSpecificationSchemaInput = {
      categoryId: "category-1",
      name: "Mobile & Tablets Specification Schema",
      slug: "mobile-tablets",

      groups: [
        {
          name: "Display",
          slug: "display",

          definitions: [
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
            },
          ],
        },
      ],
    };

    const createdSchema = {
      id: "schema-1",
      name: input.name,
      slug: input.slug,
    };

    vi.mocked(
      repository.createSpecificationSchemaRecord,
    ).mockResolvedValue(createdSchema as never);

    const result =
      await createSpecificationSchema(input);

    expect(
      repository.createSpecificationSchemaRecord,
    ).toHaveBeenCalledTimes(1);

    expect(
      repository.createSpecificationSchemaRecord,
    ).toHaveBeenCalledWith({
      categoryId: "category-1",
      name: "Mobile & Tablets Specification Schema",
      slug: "mobile-tablets",
      description: undefined,

      groups: {
        create: [
          {
            name: "Display",
            slug: "display",
            description: undefined,
            sortOrder: 0,

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
                  configuration: undefined,
                },
              ],
            },
          },
        ],
      },
    });

    expect(result).toEqual(createdSchema);
  });

  it("keeps validation inside the service", async () => {
    const input: CreateSpecificationSchemaInput = {
      categoryId: "category-1",
      name: "Invalid Schema",
      slug: "invalid-schema",

      groups: [
        {
          name: "Display",
          slug: "display",

          definitions: [
            {
              name: "Unknown",
              slug: "unknown",
              dataType: "INVALID_TYPE",
            },
          ],
        },
      ],
    };

    await expect(
      createSpecificationSchema(input),
    ).rejects.toThrow(
      "Unsupported specification data type: INVALID_TYPE",
    );

    expect(
      repository.createSpecificationSchemaRecord,
    ).not.toHaveBeenCalled();
  });
});