import {
  createSpecificationSchemaRecord,
  deactivateSpecificationSchemaRecord,
  findSpecificationSchemaById,
  findSpecificationSchemaBySlug,
  listSpecificationSchemas as listSpecificationSchemaRecords,
  updateSpecificationSchemaRecord,
} from "./specification.repository";

import {
  isSpecificationDataType,
} from "./specification.types";

export type CreateSpecificationSchemaInput = {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;

  groups: {
    name: string;
    slug: string;
    description?: string;
    sortOrder?: number;

    definitions: {
      name: string;
      slug: string;
      dataType: string;
      unit?: string;

      isRequired?: boolean;
      isFilterable?: boolean;
      isComparable?: boolean;
      isSearchable?: boolean;

      sortOrder?: number;
      configuration?: unknown;

      options?: {
        label: string;
        value: string;
        sortOrder?: number;
      }[];
    }[];
  }[];
};

export type UpdateSpecificationSchemaInput = {
  name?: string;
  description?: string;

  groups?: {
    name: string;
    slug: string;
    description?: string;
    sortOrder?: number;

    definitions: {
      name: string;
      slug: string;
      dataType: string;
      unit?: string;

      isRequired?: boolean;
      isFilterable?: boolean;
      isComparable?: boolean;
      isSearchable?: boolean;

      sortOrder?: number;
      configuration?: unknown;

      options?: {
        label: string;
        value: string;
        sortOrder?: number;
      }[];
    }[];
  }[];
};

/* =========================================================
   VALIDATION
========================================================= */

function validateSpecificationGroups(
  groups: CreateSpecificationSchemaInput["groups"],
) {
  for (const group of groups) {
    for (const definition of group.definitions) {
      if (!isSpecificationDataType(definition.dataType)) {
        throw new Error(
          `Unsupported specification data type: ${definition.dataType}`,
        );
      }

      if (
        definition.dataType === "SELECT" &&
        (!definition.options ||
          definition.options.length === 0)
      ) {
        throw new Error(
          "SELECT specification must have at least one option",
        );
      }

      if (
        definition.dataType === "MULTI_SELECT" &&
        (!definition.options ||
          definition.options.length === 0)
      ) {
        throw new Error(
          "MULTI_SELECT specification must have at least one option",
        );
      }

      if (
        definition.options &&
        definition.options.length > 0 &&
        definition.dataType !== "SELECT" &&
        definition.dataType !== "MULTI_SELECT"
      ) {
        throw new Error(
          "Only SELECT and MULTI_SELECT specifications can have options",
        );
      }
    }
  }
}

/* =========================================================
   CREATE
========================================================= */

export async function createSpecificationSchema(
  input: CreateSpecificationSchemaInput,
) {
  validateSpecificationGroups(input.groups);

  return createSpecificationSchemaRecord({
    categoryId: input.categoryId,
    name: input.name,
    slug: input.slug,
    description: input.description,

    groups: {
      create: input.groups.map((group) => ({
        name: group.name,
        slug: group.slug,
        description: group.description,
        sortOrder: group.sortOrder ?? 0,

        definitions: {
          create: group.definitions.map(
            (definition) => ({
              name: definition.name,
              slug: definition.slug,
              dataType: definition.dataType,
              unit: definition.unit,

              isRequired:
                definition.isRequired ?? false,

              isFilterable:
                definition.isFilterable ?? false,

              isComparable:
                definition.isComparable ?? false,

              isSearchable:
                definition.isSearchable ?? false,

              sortOrder:
                definition.sortOrder ?? 0,

              configuration:
                definition.configuration,

              ...(definition.options?.length
                ? {
                    options: {
                      create:
                        definition.options.map(
                          (option) => ({
                            label: option.label,
                            value: option.value,
                            sortOrder:
                              option.sortOrder ?? 0,
                          }),
                        ),
                    },
                  }
                : {}),
            }),
          ),
        },
      })),
    },
  });
}

/* =========================================================
   GET BY ID
========================================================= */

export async function getSpecificationSchemaById(
  id: string,
) {
  return findSpecificationSchemaById(id);
}

/* =========================================================
   GET BY SLUG
========================================================= */

export async function getSpecificationSchemaBySlug(
  slug: string,
) {
  return findSpecificationSchemaBySlug(slug);
}

/* =========================================================
   LIST
========================================================= */

export async function listSpecificationSchemas() {
  return listSpecificationSchemaRecords();
}

/* =========================================================
   UPDATE
========================================================= */

export async function updateSpecificationSchema(
  id: string,
  input: UpdateSpecificationSchemaInput,
) {
  if (input.groups !== undefined) {
    validateSpecificationGroups(input.groups);
  }

  const data: Record<string, unknown> = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  /*
   * When groups are supplied, replace the existing
   * schema structure rather than blindly appending
   * duplicate groups.
   */
  if (input.groups !== undefined) {
    data.groups = {
      deleteMany: {},

      create: input.groups.map((group) => ({
        name: group.name,
        slug: group.slug,
        description: group.description,
        sortOrder: group.sortOrder ?? 0,

        definitions: {
          create: group.definitions.map(
            (definition) => ({
              name: definition.name,
              slug: definition.slug,
              dataType: definition.dataType,
              unit: definition.unit,

              isRequired:
                definition.isRequired ?? false,

              isFilterable:
                definition.isFilterable ?? false,

              isComparable:
                definition.isComparable ?? false,

              isSearchable:
                definition.isSearchable ?? false,

              sortOrder:
                definition.sortOrder ?? 0,

              configuration:
                definition.configuration,

              ...(definition.options?.length
                ? {
                    options: {
                      create:
                        definition.options.map(
                          (option) => ({
                            label: option.label,
                            value: option.value,
                            sortOrder:
                              option.sortOrder ?? 0,
                          }),
                        ),
                    },
                  }
                : {}),
            }),
          ),
        },
      })),
    };
  }

  return updateSpecificationSchemaRecord(
    id,
    data,
  );
}

/* =========================================================
   DELETE / DEACTIVATE
========================================================= */

export async function deleteSpecificationSchema(
  id: string,
) {
  const existing =
    await findSpecificationSchemaById(id);

  if (!existing) {
    return null;
  }

  /*
   * Soft delete.
   *
   * We keep the schema and its historical structure
   * in the database and simply make it inactive.
   */
  return deactivateSpecificationSchemaRecord(id);
}