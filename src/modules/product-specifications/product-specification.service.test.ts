import { beforeEach, describe, expect, it, vi } from "vitest";

import prisma from "../../db/prisma";
import {
  getProductSpecifications,
  updateProductSpecifications,
} from "./product-specification.service";
import { Prisma } from "@prisma/client";

vi.mock("../../db/prisma", () => ({
  default: {
    product: {
      findUnique: vi.fn(),
    },
    specificationSchema: {
      findFirst: vi.fn(),
    },
    productSpecification: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockedPrisma = prisma as unknown as {
  product: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  specificationSchema: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  productSpecification: {
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const product = {
  id: "product-1",
  name: "Test Phone",
  categoryId: "category-mobile",
};

const textDefinition = {
  id: "definition-name",
  name: "Display Name",
  slug: "display-name",
  dataType: "TEXT",
  unit: null,
  isRequired: false,
  options: [],
};

const numberDefinition = {
  id: "definition-weight",
  name: "Weight",
  slug: "weight",
  dataType: "NUMBER",
  unit: "g",
  isRequired: false,
  options: [],
};

const booleanDefinition = {
  id: "definition-waterproof",
  name: "Waterproof",
  slug: "waterproof",
  dataType: "BOOLEAN",
  unit: null,
  isRequired: false,
  options: [],
};

const selectDefinition = {
  id: "definition-os",
  name: "Operating System",
  slug: "operating-system",
  dataType: "SELECT",
  unit: null,
  isRequired: false,
  options: [
    {
      id: "option-android",
      label: "Android",
      value: "android",
      isActive: true,
    },
    {
      id: "option-ios",
      label: "iOS",
      value: "ios",
      isActive: true,
    },
    {
      id: "option-old",
      label: "Old OS",
      value: "old-os",
      isActive: false,
    },
  ],
};

const multiSelectDefinition = {
  id: "definition-features",
  name: "Features",
  slug: "features",
  dataType: "MULTI_SELECT",
  unit: null,
  isRequired: false,
  options: [
    {
      id: "feature-5g",
      label: "5G",
      value: "5g",
      isActive: true,
    },
    {
      id: "feature-nfc",
      label: "NFC",
      value: "nfc",
      isActive: true,
    },
    {
      id: "feature-old",
      label: "Old Feature",
      value: "old-feature",
      isActive: false,
    },
  ],
};

const requiredDefinition = {
  id: "definition-required",
  name: "Required Field",
  slug: "required-field",
  dataType: "TEXT",
  unit: null,
  isRequired: false,
  options: [],
};

const schema = {
  id: "schema-mobile",
  name: "Mobile Phone Specifications",
  slug: "mobile-phone-specifications-v1",
  description: "Mobile specification schema",
  version: 1,
  isActive: true,
  categoryId: "category-mobile",
  groups: [
    {
      id: "group-general",
      name: "General",
      slug: "general",
      description: null,
      sortOrder: 0,
      definitions: [
        textDefinition,
        numberDefinition,
        booleanDefinition,
        selectDefinition,
        multiSelectDefinition,
        requiredDefinition,
      ],
    },
  ],
};

const requiredSchema = {
  ...schema,
  groups: [
    {
      ...schema.groups[0],
      definitions: [
        ...schema.groups[0]!.definitions.map((definition) =>
          definition.id === "definition-required"
            ? {
                ...definition,
                isRequired: true,
              }
            : definition,
        ),
      ],
    },
  ],
};

const transactionPrisma = {
  productSpecification: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();

  mockedPrisma.$transaction.mockImplementation(async (callback) => {
    return callback(transactionPrisma as never);
  });
});

/* =========================================================
   GET
========================================================= */

describe("getProductSpecifications", () => {
  it("returns the product, active schema and schema-driven values", async () => {
    const existingValues = [
      {
        id: "ps-1",
        productId: "product-1",
        definitionId: "definition-name",
        valueText: "AMOLED Display",
      },
    ];

    mockedPrisma.product.findUnique.mockResolvedValue(product as never);

    mockedPrisma.specificationSchema.findFirst.mockResolvedValue(
      schema as never,
    );

    mockedPrisma.productSpecification.findMany.mockResolvedValue(
      existingValues as never,
    );

    const result = await getProductSpecifications("product-1");

    expect(result.product).toEqual(product);
    expect(result.schema).toEqual(schema);
    expect(result.values).toEqual(existingValues);

    expect(
      mockedPrisma.productSpecification.findMany,
    ).toHaveBeenCalledWith({
      where: {
        productId: "product-1",
        definitionId: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  });

  it("throws when the product does not exist", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(null);

    await expect(
      getProductSpecifications("missing-product"),
    ).rejects.toThrow("Product not found");

    expect(
      mockedPrisma.specificationSchema.findFirst,
    ).not.toHaveBeenCalled();
  });

  it("throws when no active schema exists", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(product as never);

    mockedPrisma.specificationSchema.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      getProductSpecifications("product-1"),
    ).rejects.toThrow(
      "No active specification schema found for product category",
    );
  });
});

/* =========================================================
   UPDATE
========================================================= */

describe("updateProductSpecifications", () => {
  beforeEach(() => {
    mockedPrisma.product.findUnique.mockResolvedValue(
      product as never,
    );

    mockedPrisma.specificationSchema.findFirst.mockResolvedValue(
      schema as never,
    );

    transactionPrisma.productSpecification.findMany.mockResolvedValue(
      [],
    );
  });

  it("stores TEXT values in valueText", async () => {
    await updateProductSpecifications("product-1", {
      values: [
        {
          definitionId: "definition-name",
          value: "AMOLED Display",
        },
      ],
    });

    expect(
      transactionPrisma.productSpecification.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        productId: "product-1",
        definitionId: {
          not: null,
        },
      },
    });

    expect(
      transactionPrisma.productSpecification.createMany,
    ).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productId: "product-1",
          definitionId: "definition-name",
          valueText: "AMOLED Display",
          valueNumber: null,
          valueBoolean: null,
          valueDate: null,
          valueJson: Prisma.JsonNull,
        }),
      ],
    });
  });

  it("stores NUMBER values in valueNumber", async () => {
    await updateProductSpecifications("product-1", {
      values: [
        {
          definitionId: "definition-weight",
          value: 195,
        },
      ],
    });

    expect(
      transactionPrisma.productSpecification.createMany,
    ).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          definitionId: "definition-weight",
          valueNumber: 195,
          valueText: null,
          valueBoolean: null,
          valueDate: null,
          valueJson: Prisma.JsonNull,
        }),
      ],
    });
  });

  it("stores BOOLEAN values in valueBoolean", async () => {
    await updateProductSpecifications("product-1", {
      values: [
        {
          definitionId: "definition-waterproof",
          value: true,
        },
      ],
    });

    expect(
      transactionPrisma.productSpecification.createMany,
    ).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          definitionId: "definition-waterproof",
          valueBoolean: true,
          valueText: null,
          valueNumber: null,
          valueDate: null,
          valueJson: Prisma.JsonNull,
        }),
      ],
    });
  });

  it("stores SELECT values in valueText", async () => {
    await updateProductSpecifications("product-1", {
      values: [
        {
          definitionId: "definition-os",
          value: "android",
        },
      ],
    });

    expect(
      transactionPrisma.productSpecification.createMany,
    ).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          definitionId: "definition-os",
          valueText: "android",
        }),
      ],
    });
  });

  it("stores MULTI_SELECT values in valueJson", async () => {
    await updateProductSpecifications("product-1", {
      values: [
        {
          definitionId: "definition-features",
          value: ["5g", "nfc"],
        },
      ],
    });

    expect(
      transactionPrisma.productSpecification.createMany,
    ).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          definitionId: "definition-features",
          valueJson: ["5g", "nfc"],
        }),
      ],
    });
  });

  it("preserves legacy ProductSpecification rows", async () => {
    await updateProductSpecifications("product-1", {
      values: [
        {
          definitionId: "definition-name",
          value: "AMOLED Display",
        },
      ],
    });

    expect(
      transactionPrisma.productSpecification.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        productId: "product-1",
        definitionId: {
          not: null,
        },
      },
    });

    const deleteCall =
  transactionPrisma.productSpecification.deleteMany
    .mock.calls[0]![0];

    expect(deleteCall.where).toEqual({
      productId: "product-1",
      definitionId: {
        not: null,
      },
    });
  });

  it("throws when the product does not exist", async () => {
    mockedPrisma.product.findUnique.mockResolvedValue(null);

    await expect(
      updateProductSpecifications("missing-product", {
        values: [],
      }),
    ).rejects.toThrow("Product not found");

    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("throws when no active schema exists", async () => {
    mockedPrisma.specificationSchema.findFirst.mockResolvedValue(
      null,
    );

    await expect(
      updateProductSpecifications("product-1", {
        values: [],
      }),
    ).rejects.toThrow(
      "No active specification schema found for product category",
    );

    expect(mockedPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an unknown definition", async () => {
    await expect(
      updateProductSpecifications("product-1", {
        values: [
          {
            definitionId: "does-not-exist",
            value: "test",
          },
        ],
      }),
    ).rejects.toThrow(
      "Specification definition not found in active schema: does-not-exist",
    );

    expect(
      transactionPrisma.productSpecification.deleteMany,
    ).not.toHaveBeenCalled();
  });

  it("rejects an invalid NUMBER value", async () => {
    await expect(
      updateProductSpecifications("product-1", {
        values: [
          {
            definitionId: "definition-weight",
            value: "195",
          } as never,
        ],
      }),
    ).rejects.toThrow();

    expect(
      transactionPrisma.productSpecification.deleteMany,
    ).not.toHaveBeenCalled();
  });

  it("rejects an invalid SELECT option", async () => {
    await expect(
      updateProductSpecifications("product-1", {
        values: [
          {
            definitionId: "definition-os",
            value: "windows-phone",
          },
        ],
      }),
    ).rejects.toThrow(
      'Invalid option "windows-phone" for specification "operating-system"',
    );

    expect(
      transactionPrisma.productSpecification.deleteMany,
    ).not.toHaveBeenCalled();
  });

  it("rejects an inactive SELECT option", async () => {
    await expect(
      updateProductSpecifications("product-1", {
        values: [
          {
            definitionId: "definition-os",
            value: "old-os",
          },
        ],
      }),
    ).rejects.toThrow(
      'Invalid option "old-os" for specification "operating-system"',
    );
  });

  it("rejects an invalid MULTI_SELECT option", async () => {
    await expect(
      updateProductSpecifications("product-1", {
        values: [
          {
            definitionId: "definition-features",
            value: ["5g", "invalid-feature"],
          },
        ],
      }),
    ).rejects.toThrow(
      'Invalid option "invalid-feature" for specification "features"',
    );
  });

  it("rejects a missing required specification", async () => {
  mockedPrisma.specificationSchema.findFirst.mockResolvedValue(
    requiredSchema as never,
  );

  await expect(
    updateProductSpecifications("product-1", {
      values: [],
    }),
  ).rejects.toThrow(
    'Required specification "required-field" is missing',
  );

  expect(
    transactionPrisma.productSpecification.deleteMany,
  ).not.toHaveBeenCalled();
});

  it("rejects an empty required string", async () => {
  mockedPrisma.specificationSchema.findFirst.mockResolvedValue(
    requiredSchema as never,
  );

  await expect(
    updateProductSpecifications("product-1", {
      values: [
        {
          definitionId: "definition-required",
          value: "   ",
        },
      ],
    }),
  ).rejects.toThrow(
    'Required specification "required-field" is missing',
  );
});

  it("rejects duplicate definition IDs", async () => {
    await expect(
      updateProductSpecifications("product-1", {
        values: [
          {
            definitionId: "definition-name",
            value: "First",
          },
          {
            definitionId: "definition-name",
            value: "Second",
          },
        ],
      }),
    ).rejects.toThrow(
      "Duplicate specification definition: definition-name",
    );

    expect(
      transactionPrisma.productSpecification.deleteMany,
    ).not.toHaveBeenCalled();
  });

  it("allows an empty optional specification set when there are no required definitions", async () => {
    const optionalSchema = {
      ...schema,
      groups: [
        {
          ...schema.groups[0],
          definitions: [
            textDefinition,
            numberDefinition,
          ],
        },
      ],
    };

    mockedPrisma.specificationSchema.findFirst.mockResolvedValue(
      optionalSchema as never,
    );

    await updateProductSpecifications("product-1", {
      values: [],
    });

    expect(
      transactionPrisma.productSpecification.deleteMany,
    ).toHaveBeenCalledWith({
      where: {
        productId: "product-1",
        definitionId: {
          not: null,
        },
      },
    });

    expect(
      transactionPrisma.productSpecification.createMany,
    ).not.toHaveBeenCalled();
  });
});