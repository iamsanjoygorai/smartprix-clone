import { Request, Response } from "express";
import prisma from "../db/prisma";

/* =========================================================
   GET USER FAVORITES
   GET /api/favorites
========================================================= */

export const getFavorites = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user || typeof req.user === "string") {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userId = req.user.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        product: {
          include: {
            brand: true,

            category: true,

            images: {
              orderBy: {
                sortOrder: "asc",
              },
            },

            prices: {
              where: {
                inStock: true,
              },

              orderBy: {
                amount: "asc",
              },

              include: {
                seller: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error("Failed to fetch favorites:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch favorites",
    });
  }
};

/* =========================================================
   ADD FAVORITE
   POST /api/favorites/:productId
========================================================= */

export const addFavorite = async (
  req: Request,
  res: Response,
) => {
  try {
    /* -------------------------------------------------------
       AUTHENTICATION
    ------------------------------------------------------- */

    if (!req.user || typeof req.user === "string") {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userId = req.user.userId;
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    /* -------------------------------------------------------
       CHECK PRODUCT
    ------------------------------------------------------- */

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },

      select: {
        id: true,
        isActive: true,
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (!product.isActive) {
      res.status(400).json({
        success: false,
        message: "Product is not available",
      });
      return;
    }

    /* -------------------------------------------------------
       CREATE FAVORITE
    ------------------------------------------------------- */

    const favorite =
      await prisma.favorite.upsert({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },

        update: {},

        create: {
          userId,
          productId,
        },

        include: {
          product: {
            include: {
              brand: true,
              images: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      });

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    res.status(201).json({
      success: true,
      message: "Added to favorites",
      data: favorite,
    });
  } catch (error) {
    console.error(
      "Add favorite failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to add favorite",
    });
  }
};

/* =========================================================
   REMOVE FAVORITE
   DELETE /api/favorites/:productId
========================================================= */

export const removeFavorite = async (
  req: Request,
  res: Response,
) => {
  try {
    /* -------------------------------------------------------
       AUTHENTICATION
    ------------------------------------------------------- */

    if (!req.user || typeof req.user === "string") {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userId = req.user.userId;
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    /* -------------------------------------------------------
       REMOVE FAVORITE
    ------------------------------------------------------- */

    const favorite =
      await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },

        select: {
          id: true,
        },
      });

    if (!favorite) {
      res.status(404).json({
        success: false,
        message: "Product is not in favorites",
      });
      return;
    }

    await prisma.favorite.delete({
      where: {
        id: favorite.id,
      },
    });

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    res.status(200).json({
      success: true,
      message: "Removed from favorites",
    });
  } catch (error) {
    console.error(
      "Remove favorite failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to remove favorite",
    });
  }
};

/* =========================================================
   CHECK FAVORITE
   GET /api/favorites/:productId
========================================================= */

export const checkFavorite = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user || typeof req.user === "string") {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userId = req.user.userId;
    const { productId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const favorite =
      await prisma.favorite.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },

        select: {
          id: true,
        },
      });

    res.status(200).json({
      success: true,
      data: {
        isFavorite: Boolean(favorite),
      },
    });
  } catch (error) {
    console.error(
      "Check favorite failed:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to check favorite",
    });
  }
};