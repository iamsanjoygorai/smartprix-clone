import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

function createSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(
  name: string,
  excludeId?: string,
) {
  const baseSlug = createSlug(name);

  if (!baseSlug) {
    throw new Error("Brand name cannot create a valid slug.");
  }

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.brand.findUnique({
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
 * GET /admin/brands
 */
export async function getAdminBrands(
  req: Request,
  res: Response,
) {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error(
      "Failed to get admin brands:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load brands.",
    });
  }
}

/**
 * GET /admin/brands/:id
 */
export async function getAdminBrand(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    return res.json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error(
      "Failed to get admin brand:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load brand.",
    });
  }
}

/**
 * POST /admin/brands
 */
export async function createAdminBrand(
  req: Request,
  res: Response,
) {
  try {
    const {
      name,
      description,
      logoUrl,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required.",
      });
    }

    const trimmedName = name.trim();

    const existingName =
      await prisma.brand.findFirst({
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
          "A brand with this name already exists.",
      });
    }

    const slug =
      await generateUniqueSlug(trimmedName);

    const brand =
      await prisma.brand.create({
        data: {
          name: trimmedName,
          slug,
          description:
            typeof description === "string"
              ? description.trim() || null
              : null,
          logoUrl:
            typeof logoUrl === "string"
              ? logoUrl.trim() || null
              : null,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,
      message: "Brand created successfully.",
      data: brand,
    });
  } catch (error) {
    console.error(
      "Failed to create admin brand:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create brand.",
    });
  }
}

/**
 * PUT /admin/brands/:id
 */
export async function updateAdminBrand(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;

    const existingBrand =
      await prisma.brand.findUnique({
        where: {
          id,
        },
      });

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    const {
      name,
      description,
      logoUrl,
    } = req.body;

    const data: {
      name?: string;
      slug?: string;
      description?: string | null;
      logoUrl?: string | null;
    } = {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Brand name cannot be empty.",
        });
      }

      const trimmedName = name.trim();

      const duplicateName =
        await prisma.brand.findFirst({
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
            "A brand with this name already exists.",
        });
      }

      data.name = trimmedName;

      data.slug =
        await generateUniqueSlug(
          trimmedName,
          id,
        );
    }

    if (description !== undefined) {
      data.description =
        typeof description === "string"
          ? description.trim() || null
          : null;
    }

    if (logoUrl !== undefined) {
      data.logoUrl =
        typeof logoUrl === "string"
          ? logoUrl.trim() || null
          : null;
    }

    const brand =
      await prisma.brand.update({
        where: {
          id,
        },
        data,
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

    return res.json({
      success: true,
      message: "Brand updated successfully.",
      data: brand,
    });
  } catch (error) {
    console.error(
      "Failed to update admin brand:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update brand.",
    });
  }
}

/**
 * DELETE /admin/brands/:id
 */
export async function deleteAdminBrand(
  req: Request,
  res: Response,
) {
  try {
    const { id } = req.params;

    const brand =
      await prisma.brand.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    if (brand._count.products > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This brand cannot be deleted because products are assigned to it.",
      });
    }

    await prisma.brand.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
      message: "Brand deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Failed to delete admin brand:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete brand.",
    });
  }
}