import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  updateSpecificationSchema,
} from "./specification.service";

import * as repository from "./specification.repository";

vi.mock("./specification.repository", () => ({
  updateSpecificationSchemaRecord: vi.fn(),
}));

describe("Specification Service - Update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates a valid schema update to the repository", async () => {
    const input = {
      name: "Updated Mobile & Tablets Schema",
      description: "Updated schema description",

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

    const updatedSchema = {
      id: "schema-1",
      name: "Updated Mobile & Tablets Schema",
    };

    vi.mocked(
      repository.updateSpecificationSchemaRecord,
    ).mockResolvedValue(updatedSchema as never);

    const result =
      await updateSpecificationSchema(
        "schema-1",
        input,
      );

    expect(
      repository.updateSpecificationSchemaRecord,
    ).toHaveBeenCalledTimes(1);

    expect(
      repository.updateSpecificationSchemaRecord,
    ).toHaveBeenCalledWith(
      "schema-1",
      {
        name: "Updated Mobile & Tablets Schema",
        description: "Updated schema description",

        groups: {
  deleteMany: {},

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
      },
    );

    expect(result).toEqual(updatedSchema);
  });

  it("rejects unsupported specification data types", async () => {
    const input = {
      groups: [
        {
          name: "Display",
          slug: "display",

          definitions: [
            {
              name: "Invalid Specification",
              slug: "invalid-specification",
              dataType: "INVALID_TYPE",
            },
          ],
        },
      ],
    };

    await expect(
      updateSpecificationSchema(
        "schema-1",
        input,
      ),
    ).rejects.toThrow(
      "Unsupported specification data type: INVALID_TYPE",
    );

    expect(
      repository.updateSpecificationSchemaRecord,
    ).not.toHaveBeenCalled();
  });

  it("rejects SELECT definitions without options", async () => {
    const input = {
      groups: [
        {
          name: "Display",
          slug: "display",

          definitions: [
            {
              name: "Panel Type",
              slug: "panel-type",
              dataType: "SELECT",
            },
          ],
        },
      ],
    };

    await expect(
      updateSpecificationSchema(
        "schema-1",
        input,
      ),
    ).rejects.toThrow(
      "SELECT specification must have at least one option",
    );

    expect(
      repository.updateSpecificationSchemaRecord,
    ).not.toHaveBeenCalled();
  });
});