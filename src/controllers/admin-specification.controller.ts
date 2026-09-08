import { Request, Response } from "express";

import { prisma } from "../lib/prisma";

/**
 * Create a URL-safe slug from a specification name.
 */
function createSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique specification slug.
 *
 * Example:
 * screen-size
 * screen-size-2
 * screen-size-3
 */
async function generateUniqueSlug(
  name: string,
  excludeId?: string,
) {
  const baseSlug = createSlug(name);

  if (!baseSlug) {
    throw new Error(
      "Specification name cannot create a valid slug.",
    );
  }

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.specification.findUnique({
      where: {
        slug,
      },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Supported specification data types.
 */
const ALLOWED_DATA_TYPES = [
  "text",
  "number",
  "boolean",
  "select",
  "multiselect",
];

/**
 * GET /admin/specifications
 *
 * Supports:
 * GET /admin/specifications
 * GET /admin/specifications?search=screen
 * GET /admin/specifications?group=Display
 */
export async function getAdminSpecifications(
  req: Request,
  res: Response,
) {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const group =
      typeof req.query.group === "string"
        ? req.query.group.trim()
        : "";

    const specifications =
      await prisma.specification.findMany({
        where: {
          ...(search
            ? {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    slug: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    group: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {}),

          ...(group
            ? {
                group: {
                  equals: group,
                  mode: "insensitive",
                },
              }
            : {}),
        },

        orderBy: [
          {
            group: "asc",
          },
          {
            name: "asc",
          },
        ],

        include: {
          _count: {
            select: {
              products: true,
              values: true,
            },
          },
        },
      });

    return res.json({
      success: true,
      data: specifications,
    });
  } catch (error) {
    console.error(
      "Failed to get admin specifications:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load specifications.",
    });
  }
}

/**
 * GET /admin/specifications/:id
 */
export async function getAdminSpecification(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;

    const specification =
      await prisma.specification.findUnique({
        where: {
          id,
        },

        include: {
          _count: {
            select: {
              products: true,
              values: true,
            },
          },

          values: {
            orderBy: {
              value: "asc",
            },

            include: {
              _count: {
                select: {
                  products: true,
                },
              },
            },
          },

          products: {
            select: {
              id: true,
              customValue: true,

              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  isActive: true,
                },
              },

              value: {
                select: {
                  id: true,
                  value: true,
                },
              },
            },

            orderBy: {
              product: {
                name: "asc",
              },
            },
          },
        },
      });

    if (!specification) {
      return res.status(404).json({
        success: false,
        message: "Specification not found.",
      });
    }

    return res.json({
      success: true,
      data: specification,
    });
  } catch (error) {
    console.error(
      "Failed to get admin specification:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load specification.",
    });
  }
}

/**
 * POST /admin/specifications
 */
export async function createAdminSpecification(
  req: Request,
  res: Response,
) {
  try {
    const {
      name,
      unit,
      dataType,
      group,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Specification name is required.",
      });
    }

    const trimmedName = name.trim();

    /**
     * Prevent duplicate specification names
     * regardless of capitalization.
     */
    const existingName =
      await prisma.specification.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: "insensitive",
          },
        },
      });

    if (existingName) {
      return res.status(409).json({
        success: false,
        message:
          "A specification with this name already exists.",
      });
    }

    /**
     * Validate data type when supplied.
     */
    const finalDataType =
      typeof dataType === "string" &&
      dataType.trim()
        ? dataType.trim().toLowerCase()
        : "text";

    if (!ALLOWED_DATA_TYPES.includes(finalDataType)) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid data type. Allowed types: ${ALLOWED_DATA_TYPES.join(", ")}.`,
      });
    }

    const finalGroup =
      typeof group === "string" &&
      group.trim()
        ? group.trim()
        : "General";

    const finalUnit =
      typeof unit === "string"
        ? unit.trim() || null
        : null;

    const slug =
      await generateUniqueSlug(trimmedName);

    const specification =
      await prisma.specification.create({
        data: {
          name: trimmedName,
          slug,
          unit: finalUnit,
          dataType: finalDataType,
          group: finalGroup,
        },

        include: {
          _count: {
            select: {
              products: true,
              values: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Specification created successfully.",
      data: specification,
    });
  } catch (error) {
    console.error(
      "Failed to create admin specification:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create specification.",
    });
  }
}

/**
 * PUT /admin/specifications/:id
 */
export async function updateAdminSpecification(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;

    const existingSpecification =
      await prisma.specification.findUnique({
        where: {
          id,
        },
      });

    if (!existingSpecification) {
      return res.status(404).json({
        success: false,
        message: "Specification not found.",
      });
    }

    const {
      name,
      unit,
      dataType,
      group,
    } = req.body;

    const data: {
      name?: string;
      slug?: string;
      unit?: string | null;
      dataType?: string;
      group?: string;
    } = {};

    /**
     * Name
     */
    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Specification name cannot be empty.",
        });
      }

      const trimmedName = name.trim();

      const duplicateName =
        await prisma.specification.findFirst({
          where: {
            id: {
              not: id,
            },

            name: {
              equals: trimmedName,
              mode: "insensitive",
            },
          },
        });

      if (duplicateName) {
        return res.status(409).json({
          success: false,
          message:
            "A specification with this name already exists.",
        });
      }

      data.name = trimmedName;

      data.slug =
        await generateUniqueSlug(
          trimmedName,
          id,
        );
    }

    /**
     * Unit
     */
    if (unit !== undefined) {
      data.unit =
        typeof unit === "string"
          ? unit.trim() || null
          : null;
    }

    /**
     * Data type
     */
    if (dataType !== undefined) {
      if (
        typeof dataType !== "string" ||
        !dataType.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Data type cannot be empty.",
        });
      }

      const normalizedDataType =
        dataType.trim().toLowerCase();

      if (
        !ALLOWED_DATA_TYPES.includes(
          normalizedDataType,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid data type. Allowed types: ${ALLOWED_DATA_TYPES.join(", ")}.`,
        });
      }

      data.dataType =
        normalizedDataType;
    }

    /**
     * Group
     */
    if (group !== undefined) {
      if (
        typeof group !== "string" ||
        !group.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Specification group cannot be empty.",
        });
      }

      data.group = group.trim();
    }

    const specification =
      await prisma.specification.update({
        where: {
          id,
        },

        data,

        include: {
          _count: {
            select: {
              products: true,
              values: true,
            },
          },
        },
      });

    return res.json({
      success: true,
      message:
        "Specification updated successfully.",
      data: specification,
    });
  } catch (error) {
    console.error(
      "Failed to update admin specification:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update specification.",
    });
  }
}

/**
 * DELETE /admin/specifications/:id
 */
export async function deleteAdminSpecification(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;

    const specification =
      await prisma.specification.findUnique({
        where: {
          id,
        },

        include: {
          _count: {
            select: {
              products: true,
              values: true,
            },
          },
        },
      });

    if (!specification) {
      return res.status(404).json({
        success: false,
        message: "Specification not found.",
      });
    }

    /**
     * Protect specifications that are already
     * being used by products.
     */
    if (specification._count.products > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This specification cannot be deleted because it is assigned to products.",
      });
    }

    /**
     * No products are using this specification,
     * so it is safe to delete.
     *
     * SpecificationValue records are removed
     * automatically because the Prisma relation
     * uses onDelete: Cascade.
     */
    await prisma.specification.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
      message:
        "Specification deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Failed to delete admin specification:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete specification.",
    });
  }
}

