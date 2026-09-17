import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createSpecificationSchema,
  updateSpecificationSchema,
} from "./specification.service";

import {
  createSpecificationSchemaRecord,
  updateSpecificationSchemaRecord,
} from "./specification.repository";

vi.mock("./specification.repository", () => ({
  createSpecificationSchemaRecord: vi.fn(),
  updateSpecificationSchemaRecord: vi.fn(),
}));

describe("Specification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSpecificationSchema", () => {
    it("creates a schema with groups, definitions, and options", async () => {
      vi.mocked(
        createSpecificationSchemaRecord,
      ).mockResolvedValue({
        id: "schema-mobile-v1",
        name: "Mobile & Tablets",
        slug: "mobile-tablets",
        description:
          "Specification schema for mobile phones and tablets",
        version: 1,
        isActive: true,
        categoryId: "category-mobile",
      } as any);

      const result = await createSpecificationSchema({
        categoryId: "category-mobile",
        name: "Mobile & Tablets",
        slug: "mobile-tablets",
        description:
          "Specification schema for mobile phones and tablets",

        groups: [
          {
            name: "Display",
            slug: "display",
            sortOrder: 0,

            definitions: [
              {
                name: "Screen Size",
                slug: "screen-size",
                dataType: "DECIMAL",
                unit: "inch",
                isRequired: true,
                isFilterable: true,
                isComparable: true,
                isSearchable: true,
                sortOrder: 0,
              },
              {
                name: "Display Type",
                slug: "display-type",
                dataType: "SELECT",
                isFilterable: true,
                isComparable: true,
                sortOrder: 1,

                options: [
                  {
                    label: "AMOLED",
                    value: "amoled",
                    sortOrder: 0,
                  },
                  {
                    label: "OLED",
                    value: "oled",
                    sortOrder: 1,
                  },
                ],
              },
            ],
          },
        ],
      });

      expect(result).toMatchObject({
        id: "schema-mobile-v1",
        name: "Mobile & Tablets",
        slug: "mobile-tablets",
        categoryId: "category-mobile",
      });

      expect(
        createSpecificationSchemaRecord,
      ).toHaveBeenCalledTimes(1);

      expect(
        createSpecificationSchemaRecord,
      ).toHaveBeenCalledWith({
        categoryId: "category-mobile",
        name: "Mobile & Tablets",
        slug: "mobile-tablets",
        description:
          "Specification schema for mobile phones and tablets",

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
                    dataType: "DECIMAL",
                    unit: "inch",
                    isRequired: true,
                    isFilterable: true,
                    isComparable: true,
                    isSearchable: true,
                    sortOrder: 0,
                    configuration: undefined,
                  },
                  {
                    name: "Display Type",
                    slug: "display-type",
                    dataType: "SELECT",
                    unit: undefined,
                    isRequired: false,
                    isFilterable: true,
                    isComparable: true,
                    isSearchable: false,
                    sortOrder: 1,
                    configuration: undefined,

                    options: {
                      create: [
                        {
                          label: "AMOLED",
                          value: "amoled",
                          sortOrder: 0,
                        },
                        {
                          label: "OLED",
                          value: "oled",
                          sortOrder: 1,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      });
    });

    it("rejects unsupported specification data types", async () => {
      await expect(
        createSpecificationSchema({
          categoryId: "category-mobile",
          name: "Mobile & Tablets",
          slug: "mobile-tablets",

          groups: [
            {
              name: "Display",
              slug: "display",

              definitions: [
                {
                  name: "Invalid Field",
                  slug: "invalid-field",
                  dataType: "INVALID_TYPE",
                },
              ],
            },
          ],
        }),
      ).rejects.toThrow(
        "Unsupported specification data type: INVALID_TYPE",
      );

      expect(
        createSpecificationSchemaRecord,
      ).not.toHaveBeenCalled();
    });

    it("rejects SELECT definitions without options", async () => {
      await expect(
        createSpecificationSchema({
          categoryId: "category-mobile",
          name: "Mobile & Tablets",
          slug: "mobile-tablets",

          groups: [
            {
              name: "Display",
              slug: "display",

              definitions: [
                {
                  name: "Display Type",
                  slug: "display-type",
                  dataType: "SELECT",
                },
              ],
            },
          ],
        }),
      ).rejects.toThrow(
        "SELECT specification must have at least one option",
      );

      expect(
        createSpecificationSchemaRecord,
      ).not.toHaveBeenCalled();
    });

    it("rejects MULTI_SELECT definitions without options", async () => {
      await expect(
        createSpecificationSchema({
          categoryId: "category-mobile",
          name: "Mobile & Tablets",
          slug: "mobile-tablets",

          groups: [
            {
              name: "Connectivity",
              slug: "connectivity",

              definitions: [
                {
                  name: "Supported Networks",
                  slug: "supported-networks",
                  dataType: "MULTI_SELECT",
                },
              ],
            },
          ],
        }),
      ).rejects.toThrow(
        "MULTI_SELECT specification must have at least one option",
      );

      expect(
        createSpecificationSchemaRecord,
      ).not.toHaveBeenCalled();
    });

    it("rejects options for non-select specification types", async () => {
      await expect(
        createSpecificationSchema({
          categoryId: "category-mobile",
          name: "Mobile & Tablets",
          slug: "mobile-tablets",

          groups: [
            {
              name: "Display",
              slug: "display",

              definitions: [
                {
                  name: "Screen Size",
                  slug: "screen-size",
                  dataType: "DECIMAL",
                  unit: "inch",

                  options: [
                    {
                      label: "6.7",
                      value: "6.7",
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ).rejects.toThrow(
        "Only SELECT and MULTI_SELECT specifications can have options",
      );

      expect(
        createSpecificationSchemaRecord,
      ).not.toHaveBeenCalled();
    });
  });

  describe("updateSpecificationSchema", () => {
    it("updates schema metadata and delegates to repository", async () => {
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

      const repositoryMock = vi.mocked(
        updateSpecificationSchemaRecord,
      );

      repositoryMock.mockResolvedValue(
        updatedSchema as never,
      );

      const result = await updateSpecificationSchema(
        "schema-1",
        input,
      );

      expect(repositoryMock).toHaveBeenCalledTimes(1);

      expect(repositoryMock).toHaveBeenCalledWith(
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
  });
});