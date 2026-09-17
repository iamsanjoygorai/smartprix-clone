import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./specification.service", () => ({
  updateSpecificationSchema: vi.fn(),
}));

import { updateSpecificationSchema } from "./specification.service";
import { updateSpecificationSchemaController } from "./specification.controller";

describe("Specification Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateSpecificationSchemaController", () => {
    it("updates a specification schema and returns the updated schema", async () => {
      const updatedSchema = {
        id: "schema-1",
        name: "Updated Mobile & Tablets Schema",
        description: "Updated schema description",
      };

      vi.mocked(updateSpecificationSchema).mockResolvedValue(
        updatedSchema as never,
      );

      const req = {
        params: {
          id: "schema-1",
        },
        body: {
          name: "Updated Mobile & Tablets Schema",
          description: "Updated schema description",
        },
      } as any;

      const json = vi.fn();

      const res = {
        json,
        status: vi.fn().mockReturnThis(),
      } as any;

      await updateSpecificationSchemaController(req, res);

      expect(updateSpecificationSchema).toHaveBeenCalledWith(
        "schema-1",
        req.body,
      );

      expect(json).toHaveBeenCalledWith({
        success: true,
        data: updatedSchema,
      });
    });
    it("returns 500 when the service fails", async () => {
  vi.mocked(updateSpecificationSchema).mockRejectedValue(
    new Error("Database failure"),
  );

  const req = {
    params: {
      id: "schema-1",
    },
    body: {
      name: "Updated Mobile Schema",
    },
  } as any;

  const json = vi.fn();

  const res = {
    json,
    status: vi.fn().mockReturnThis(),
  } as any;

  await updateSpecificationSchemaController(req, res);

  expect(res.status).toHaveBeenCalledWith(500);

  expect(json).toHaveBeenCalledWith({
    success: false,
    message: "Failed to update specification schema.",
  });
});
it("returns 400 when the schema ID is missing", async () => {
  const req = {
    params: {},
    body: {
      name: "Updated Mobile Schema",
    },
  } as any;

  const json = vi.fn();

  const res = {
    json,
    status: vi.fn().mockReturnThis(),
  } as any;

  await updateSpecificationSchemaController(req, res);

  expect(res.status).toHaveBeenCalledWith(400);

  expect(json).toHaveBeenCalledWith({
    success: false,
    message: "Specification schema ID is required.",
  });

  expect(updateSpecificationSchema).not.toHaveBeenCalled();
});
  });
});