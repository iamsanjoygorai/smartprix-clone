import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db/prisma", () => ({
  default: {
    specificationSchema: {
      update: vi.fn(),
    },
  },
}));

import prisma from "../../db/prisma";
import {
  updateSpecificationSchemaRecord,
} from "./specification.repository";

describe("Specification Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateSpecificationSchemaRecord", () => {
    it("updates schema metadata and nested groups", async () => {
      const updatedSchema = {
        id: "schema-1",
        name: "Updated Mobile Schema",
        description: "Updated description",
      };

      vi.mocked(
        prisma.specificationSchema.update,
      ).mockResolvedValue(updatedSchema as never);

      const data = {
        name: "Updated Mobile Schema",
        description: "Updated description",

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
      };

      const result =
        await updateSpecificationSchemaRecord(
          "schema-1",
          data,
        );

      expect(
        prisma.specificationSchema.update,
      ).toHaveBeenCalledWith({
        where: {
          id: "schema-1",
        },
        data,
      });

      expect(result).toEqual(updatedSchema);
    });
  });
});