import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

import {
  getProductSpecificationsController,
  updateProductSpecificationsController,
} from "./product-specification.controller";

import {
  getProductSpecifications,
  updateProductSpecifications,
} from "./product-specification.service";

vi.mock("./product-specification.service", () => ({
  getProductSpecifications: vi.fn(),
  updateProductSpecifications: vi.fn(),
}));

const mockedGetProductSpecifications = vi.mocked(
  getProductSpecifications,
);

const mockedUpdateProductSpecifications = vi.mocked(
  updateProductSpecifications,
);

const createResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;

  vi.mocked(res.status).mockReturnValue(res);

  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

/* =========================================================
   GET
========================================================= */

describe("getProductSpecificationsController", () => {
  it("returns product specifications successfully", async () => {
    const req = {
      params: {
        id: "product-1",
      },
    } as unknown as Request;

    const res = createResponse();

    const result = {
      product: {
        id: "product-1",
        name: "Test Phone",
      },
      schema: {
        id: "schema-1",
        name: "Mobile Phone Specifications",
      },
      values: [],
    };

    mockedGetProductSpecifications.mockResolvedValue(
      result as never,
    );

    await getProductSpecificationsController(req, res);

    expect(mockedGetProductSpecifications).toHaveBeenCalledWith(
      "product-1",
    );

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: result,
    });
  });

  it("returns 400 when product id is missing", async () => {
    const req = {
      params: {},
    } as unknown as Request;

    const res = createResponse();

    await getProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product ID is required",
    });

    expect(
      mockedGetProductSpecifications,
    ).not.toHaveBeenCalled();
  });

  it("returns 400 when the product does not exist", async () => {
    const req = {
      params: {
        id: "missing-product",
      },
    } as unknown as Request;

    const res = createResponse();

    mockedGetProductSpecifications.mockRejectedValue(
      new Error("Product not found"),
    );

    await getProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  it("returns 400 when no active schema exists", async () => {
    const req = {
      params: {
        id: "product-1",
      },
    } as unknown as Request;

    const res = createResponse();

    mockedGetProductSpecifications.mockRejectedValue(
      new Error(
        "No active specification schema found for product category",
      ),
    );

    await getProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        "No active specification schema found for product category",
    });
  });

  it("returns 500 for unexpected errors", async () => {
    const req = {
      params: {
        id: "product-1",
      },
    } as unknown as Request;

    const res = createResponse();

    mockedGetProductSpecifications.mockRejectedValue(
      new Error("Database connection failed"),
    );

    await getProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to fetch product specifications",
    });
  });
});

/* =========================================================
   UPDATE
========================================================= */

describe("updateProductSpecificationsController", () => {
  it("updates product specifications successfully", async () => {
    const req = {
      params: {
        id: "product-1",
      },
      body: {
        values: [
          {
            definitionId: "definition-name",
            value: "AMOLED",
          },
        ],
      },
    } as unknown as Request;

    const res = createResponse();

    const result = [
      {
        id: "ps-1",
        productId: "product-1",
        definitionId: "definition-name",
        valueText: "AMOLED",
      },
    ];

    mockedUpdateProductSpecifications.mockResolvedValue(
      result as never,
    );

    await updateProductSpecificationsController(req, res);

    expect(
      mockedUpdateProductSpecifications,
    ).toHaveBeenCalledWith("product-1", req.body);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Product specifications updated successfully",
      data: result,
    });
  });

  it("returns 400 when product id is missing", async () => {
    const req = {
      params: {},
      body: {
        values: [],
      },
    } as unknown as Request;

    const res = createResponse();

    await updateProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product ID is required",
    });

    expect(
      mockedUpdateProductSpecifications,
    ).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid specification data", async () => {
    const req = {
      params: {
        id: "product-1",
      },
      body: {
        invalid: true,
      },
    } as unknown as Request;

    const res = createResponse();

    mockedUpdateProductSpecifications.mockRejectedValue(
      new Error("Invalid product specification data"),
    );

    await updateProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid product specification data",
    });
  });

  it("returns 400 for unknown definition", async () => {
    const req = {
      params: {
        id: "product-1",
      },
      body: {
        values: [
          {
            definitionId: "unknown-definition",
            value: "test",
          },
        ],
      },
    } as unknown as Request;

    const res = createResponse();

    mockedUpdateProductSpecifications.mockRejectedValue(
      new Error(
        "Specification definition not found in active schema: unknown-definition",
      ),
    );

    await updateProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        "Specification definition not found in active schema: unknown-definition",
    });
  });

  it("returns 400 when product does not exist", async () => {
    const req = {
      params: {
        id: "missing-product",
      },
      body: {
        values: [],
      },
    } as unknown as Request;

    const res = createResponse();

    mockedUpdateProductSpecifications.mockRejectedValue(
      new Error("Product not found"),
    );

    await updateProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Product not found",
    });
  });

  it("returns 400 when required specification is missing", async () => {
    const req = {
      params: {
        id: "product-1",
      },
      body: {
        values: [],
      },
    } as unknown as Request;

    const res = createResponse();

    mockedUpdateProductSpecifications.mockRejectedValue(
      new Error(
        'Required specification "display-size" is missing',
      ),
    );

    await updateProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message:
        'Required specification "display-size" is missing',
    });
  });

  it("returns 500 for unexpected update errors", async () => {
    const req = {
      params: {
        id: "product-1",
      },
      body: {
        values: [],
      },
    } as unknown as Request;

    const res = createResponse();

    mockedUpdateProductSpecifications.mockRejectedValue(
      new Error("Database connection failed"),
    );

    await updateProductSpecificationsController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to update product specifications",
    });
  });
});