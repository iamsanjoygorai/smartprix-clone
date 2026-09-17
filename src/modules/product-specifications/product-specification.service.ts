import { Prisma } from "@prisma/client";
import prisma from "../../db/prisma";
import {
  productSpecificationUpdateSchema,
  validateSpecificationValue,
} from "./product-specification.validator";
import type {
  ProductSpecificationUpdateInput,
} from "./product-specification.validator";

/* =========================================================
   Types
========================================================= */

type SchemaDefinition = {
  id: string;
  name: string;
  slug: string;
  dataType: string;
  unit: string | null;
  isRequired: boolean;
  options: Array<{
    id: string;
    label: string;
    value: string;
    isActive: boolean;
  }>;
};

type SchemaWithDefinitions = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  version: number;
  isActive: boolean;
  categoryId: string;
  groups: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    definitions: SchemaDefinition[];
  }>;
};

/* =========================================================
   GET PRODUCT SPECIFICATIONS
========================================================= */

export const getProductSpecifications = async (
  productId: string,
) => {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const schema = await prisma.specificationSchema.findFirst({
    where: {
      categoryId: product.categoryId,
      isActive: true,
    },
    include: {
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
                where: {
                  isActive: true,
                },
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

  console.log("🔍 Product specification schema lookup:", {
  productId,
  productCategoryId: product.categoryId,
  schemaFound: !!schema,
  schemaId: schema?.id,
  schemaCategoryId: schema?.categoryId,
  schemaIsActive: schema?.isActive,
});

  if (!schema) {
    throw new Error(
      "No active specification schema found for product category",
    );
  }

  const values = await prisma.productSpecification.findMany({
    where: {
      productId,
      definitionId: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return {
    product,
    schema,
    values,
  };
};

/* =========================================================
   UPDATE PRODUCT SPECIFICATIONS
========================================================= */

export const updateProductSpecifications = async (
  productId: string,
  input: ProductSpecificationUpdateInput,
) => {
  const parsed = productSpecificationUpdateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Invalid product specification data");
  }

  const data = parsed.data;

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const schema = await prisma.specificationSchema.findFirst({
    where: {
      categoryId: product.categoryId,
      isActive: true,
    },
    include: {
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

  if (!schema) {
    throw new Error(
      "No active specification schema found for product category",
    );
  }

  const definitions = flattenDefinitions(schema);

  const definitionMap = new Map(
    definitions.map((definition) => [
      definition.id,
      definition,
    ]),
  );

  /* =======================================================
     Validate duplicate definitions
  ======================================================= */

  const submittedDefinitionIds = new Set<string>();

  for (const item of data.values) {
    if (submittedDefinitionIds.has(item.definitionId)) {
      throw new Error(
        `Duplicate specification definition: ${item.definitionId}`,
      );
    }

    submittedDefinitionIds.add(item.definitionId);
  }

  /* =======================================================
     Validate required definitions
  ======================================================= */

  for (const definition of definitions) {
    if (!definition.isRequired) {
      continue;
    }

    const submitted = data.values.find(
      (item) => item.definitionId === definition.id,
    );

    if (
      !submitted ||
      submitted.value === null ||
      submitted.value === undefined ||
      isEmptySpecificationValue(submitted.value)
    ) {
      throw new Error(
        `Required specification "${definition.slug}" is missing`,
      );
    }
  }

  /* =======================================================
     Validate submitted definitions + values
  ======================================================= */

  const preparedValues = data.values.map((item) => {
    const definition = definitionMap.get(item.definitionId);

    if (!definition) {
      throw new Error(
        `Specification definition not found in active schema: ${item.definitionId}`,
      );
    }

    const validation = validateSpecificationValue(
      definition.dataType,
      item.value,
    );

    if (!validation.valid) {
      throw new Error(validation.message ?? "Invalid specification value");
    }

    validateDefinitionOptions(definition, item.value);

    return {
      definition,
      value: item.value,
    };
  });

  /* =======================================================
     Transaction
  ======================================================= */

  return prisma.$transaction(async (tx) => {
    /*
     * IMPORTANT:
     *
     * Only delete schema-driven rows.
     *
     * Existing legacy ProductSpecification records using
     * specificationId remain untouched.
     */

    await tx.productSpecification.deleteMany({
      where: {
        productId,
        definitionId: {
          not: null,
        },
      },
    });

    if (preparedValues.length > 0) {
      await tx.productSpecification.createMany({
        data: preparedValues.map(({ definition, value }) =>
          buildProductSpecificationData(
            productId,
            definition,
            value,
          ),
        ),
      });
    }

    return tx.productSpecification.findMany({
      where: {
        productId,
        definitionId: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  });
};

/* =========================================================
   HELPERS
========================================================= */

function flattenDefinitions(
  schema: SchemaWithDefinitions,
): SchemaDefinition[] {
  return schema.groups.flatMap(
    (group) => group.definitions,
  );
}

/* =========================================================
   OPTION VALIDATION
========================================================= */

function validateDefinitionOptions(
  definition: SchemaDefinition,
  value: unknown,
) {
  if (
    definition.dataType !== "SELECT" &&
    definition.dataType !== "MULTI_SELECT"
  ) {
    return;
  }

  const activeOptions = definition.options.filter(
    (option) => option.isActive,
  );

  const allowedValues = new Set(
    activeOptions.map((option) => option.value),
  );

  if (definition.dataType === "SELECT") {
    if (typeof value !== "string") {
      return;
    }

    if (!allowedValues.has(value)) {
      throw new Error(
        `Invalid option "${value}" for specification "${definition.slug}"`,
      );
    }

    return;
  }

  if (definition.dataType === "MULTI_SELECT") {
    if (!Array.isArray(value)) {
      return;
    }

    for (const item of value) {
      if (!allowedValues.has(item)) {
        throw new Error(
          `Invalid option "${item}" for specification "${definition.slug}"`,
        );
      }
    }
  }
}

/* =========================================================
   EMPTY VALUE CHECK
========================================================= */

function isEmptySpecificationValue(
  value: unknown,
): boolean {
  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

/* =========================================================
   DATABASE VALUE MAPPING
========================================================= */

function buildProductSpecificationData(
  productId: string,
  definition: SchemaDefinition,
  value: unknown,
) {
  const base = {
  productId,
  definitionId: definition.id,
  valueText: null,
  valueNumber: null,
  valueBoolean: null,
  valueDate: null,
  valueJson: Prisma.JsonNull,
};

  if (value === null || value === undefined) {
    return base;
  }

  switch (definition.dataType) {
    case "TEXT":
    case "LONG_TEXT":
    case "SELECT":
    case "URL":
    case "IMAGE":
      return {
        ...base,
        valueText: String(value),
      };

    case "NUMBER":
    case "DECIMAL":
      return {
        ...base,
        valueNumber: value as number,
      };

    case "BOOLEAN":
      return {
        ...base,
        valueBoolean: value as boolean,
      };

    case "DATE":
    case "DATETIME":
      return {
        ...base,
        valueDate: new Date(value as string),
      };

    case "MULTI_SELECT":
    case "RANGE":
    case "JSON":
      return {
        ...base,
        valueJson: value,
      };

    default:
      throw new Error(
        `Unsupported specification data type: ${definition.dataType}`,
      );
  }
}