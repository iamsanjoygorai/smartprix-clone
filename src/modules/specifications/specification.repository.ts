import prisma from "../../db/prisma";

const specificationSchemaInclude = {
  category: true,

  groups: {
    orderBy: {
      sortOrder: "asc" as const,
    },

    include: {
      definitions: {
        orderBy: {
          sortOrder: "asc" as const,
        },

        include: {
          options: {
            orderBy: {
              sortOrder: "asc" as const,
            },
          },
        },
      },
    },
  },
};

export async function findSpecificationSchemaById(
  id: string,
) {
  return prisma.specificationSchema.findUnique({
    where: {
      id,
    },
    include: specificationSchemaInclude,
  });
}

export async function findSpecificationSchemaBySlug(
  slug: string,
) {
  return prisma.specificationSchema.findUnique({
    where: {
      slug,
    },
    include: specificationSchemaInclude,
  });
}

export async function listSpecificationSchemas() {
  return prisma.specificationSchema.findMany({
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
}

export async function createSpecificationSchemaRecord(
  data: {
    categoryId: string;
    name: string;
    slug: string;
    description?: string;

    groups: {
      create: {
        name: string;
        slug: string;
        description?: string;
        sortOrder: number;

        definitions: {
          create: {
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
              create: {
                label: string;
                value: string;
                sortOrder: number;
              }[];
            };
          }[];
        };
      }[];
    };
  },
) {
  return prisma.specificationSchema.create({
    data: data as never,
  });
}

export async function updateSpecificationSchemaRecord(
  id: string,
  data: Record<string, unknown>,
) {
  return prisma.specificationSchema.update({
    where: {
      id,
    },
    data: data as never,
  });
}

export async function deactivateSpecificationSchemaRecord(
  id: string,
) {
  return prisma.specificationSchema.update({
    where: { id },
    data: {
      isActive: false,
    },
    include: specificationSchemaInclude,
  });
}