import { Request, Response } from "express";

import prisma from "../db/prisma";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(
  name: string,
  excludeId?: string,
) {
  const baseSlug = createSlug(name);

  if (!baseSlug) {
    throw new Error("Category name must contain valid characters");
  }

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existing || existing.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ==================================================
// GET ALL CATEGORIES
// ==================================================

export const getAdminCategories = async (
  _req: Request,
  res: Response,
) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Failed to fetch admin categories:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// ==================================================
// GET SINGLE CATEGORY
// ==================================================

export const getAdminCategory = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
      return;
    }

    const category = await prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Failed to fetch admin category:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};

// ==================================================
// CREATE CATEGORY
// ==================================================

export const createAdminCategory = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      name,
      description,
      imageUrl,
      parentId,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Category name is required",
      });
      return;
    }

    const trimmedName = name.trim();

    const slug = await generateUniqueSlug(
      trimmedName,
    );

    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: {
          id: parentId,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
        return;
      }
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        slug,
        description:
          typeof description === "string" &&
          description.trim()
            ? description.trim()
            : null,
        imageUrl:
          typeof imageUrl === "string" &&
          imageUrl.trim()
            ? imageUrl.trim()
            : null,
        parentId: parentId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Failed to create admin category:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

// ==================================================
// UPDATE CATEGORY
// ==================================================

export const updateAdminCategory = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      imageUrl,
      parentId,
    } = req.body;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
      return;
    }

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Category name is required",
      });
      return;
    }

    const existingCategory =
      await prisma.category.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          parentId: true,
        },
      });

    if (!existingCategory) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    if (parentId === id) {
      res.status(400).json({
        success: false,
        message: "A category cannot be its own parent",
      });
      return;
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: {
          id: parentId,
        },
        select: {
          id: true,
        },
      });

      if (!parent) {
        res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
        return;
      }

      // Prevent circular hierarchy.
      let currentParentId: string | null = parentId;

      while (currentParentId) {
        if (currentParentId === id) {
          res.status(400).json({
            success: false,
            message:
              "Category hierarchy cannot contain a circular reference",
          });
          return;
        }

        const parentCategory =
          await prisma.category.findUnique({
            where: {
              id: currentParentId,
            },
            select: {
              parentId: true,
            },
          });

        currentParentId =
          parentCategory?.parentId ?? null;
      }
    }

    const slug = await generateUniqueSlug(
      name.trim(),
      id,
    );

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name: name.trim(),
        slug,
        description:
          typeof description === "string" &&
          description.trim()
            ? description.trim()
            : null,
        imageUrl:
          typeof imageUrl === "string" &&
          imageUrl.trim()
            ? imageUrl.trim()
            : null,
        parentId: parentId || null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Failed to update admin category:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// ==================================================
// DELETE CATEGORY
// ==================================================

export const deleteAdminCategory = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
      return;
    }

    const category = await prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found",
      });
      return;
    }

    if (category._count.products > 0) {
      res.status(409).json({
        success: false,
        message:
          "Cannot delete a category that contains products",
        data: {
          productCount: category._count.products,
        },
      });
      return;
    }

    if (category._count.children > 0) {
      res.status(409).json({
        success: false,
        message:
          "Cannot delete a category that contains child categories",
        data: {
          childCount: category._count.children,
        },
      });
      return;
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete admin category:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};