import { Request, Response } from "express";

import {
  createNewsSchema,
  updateNewsSchema,
} from "../validators/news.validator";

import {
  createNews,
  deleteNews,
  deleteNewsBulk,
  getAllNews,
  getNewsById,
  getNewsBySlug,
  updateNews,
} from "../services/news.service";


// ─────────────────────────────────────────────
// CREATE NEWS
// ─────────────────────────────────────────────

export const createNewsPost = async (
  req: Request,
  res: Response,
) => {
  try {
    const result =
      createNewsSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid news data",
        errors:
          result.error.flatten().fieldErrors,
      });

      return;
    }

    const news = await createNews(result.data);

    res.status(201).json({
      success: true,
      message: "News created successfully",
      data: news,
    });
  } catch (error) {
    console.error(
      "Failed to create news:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to create news",
    });
  }
};


// ─────────────────────────────────────────────
// ADMIN NEWS LIST
// ─────────────────────────────────────────────

export const getAdminNews = async (
  _req: Request,
  res: Response,
) => {
  try {
    const news = await getAllNews();

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error(
      "Failed to fetch news:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
};


// ─────────────────────────────────────────────
// GET NEWS BY ID
// ─────────────────────────────────────────────

export const getAdminNewsById = async (
  req: Request,
  res: Response,
) => {
  try {
    const news = await getNewsById(req.params.id);

    if (!news) {
      res.status(404).json({
        success: false,
        message: "News not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error(
      "Failed to fetch news:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
};


// ─────────────────────────────────────────────
// UPDATE NEWS
// ─────────────────────────────────────────────

export const updateNewsPost = async (
  req: Request,
  res: Response,
) => {
  try {
    const result =
      updateNewsSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid news data",
        errors:
          result.error.flatten().fieldErrors,
      });

      return;
    }

    const news = await updateNews(
      req.params.id,
      result.data,
    );

    res.status(200).json({
      success: true,
      message: "News updated successfully",
      data: news,
    });
  } catch (error) {
    console.error(
      "Failed to update news:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update news";

    if (message === "News not found") {
      res.status(404).json({
        success: false,
        message,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update news",
    });
  }
};


// ─────────────────────────────────────────────
// DELETE NEWS
// ─────────────────────────────────────────────

export const deleteNewsPost = async (
  req: Request,
  res: Response,
) => {
  try {
    await deleteNews(req.params.id);

    res.status(200).json({
      success: true,
      message: "News deleted successfully",
    });
  } catch (error) {
    console.error(
      "Failed to delete news:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete news";

    if (message === "News not found") {
      res.status(404).json({
        success: false,
        message,
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete news",
    });
  }
};


// ─────────────────────────────────────────────
// BULK DELETE NEWS
// ─────────────────────────────────────────────

export const deleteNewsBulkPost = async (
  req: Request,
  res: Response,
) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({
        success: false,
        message: "No news posts selected",
      });
      return;
    }

    const validIds = ids.filter(
      (id): id is string =>
        typeof id === "string" && id.trim().length > 0,
    );

    if (validIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "Invalid news post IDs",
      });
      return;
    }

    const deletedCount = await deleteNewsBulk(validIds);

    res.status(200).json({
      success: true,
      message: `${deletedCount} news post${
        deletedCount === 1 ? "" : "s"
      } deleted successfully`,
      data: {
        deletedCount,
      },
    });
  } catch (error) {
    console.error(
      "Failed to bulk delete news:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete selected news posts",
    });
  }
};


// ─────────────────────────────────────────────
// PUBLIC NEWS LIST
// ─────────────────────────────────────────────

export const getPublicNews = async (
  _req: Request,
  res: Response,
) => {
  try {
    const news = await getAllNews();

    const publishedNews = news.filter(
      (post) => post.status === "PUBLISHED",
    );

    res.status(200).json({
      success: true,
      data: publishedNews,
    });
  } catch (error) {
    console.error(
      "Failed to fetch public news:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
};

// ─────────────────────────────────────────────
// PUBLIC NEWS BY SLUG
// ─────────────────────────────────────────────

export const getPublicNewsBySlug = async (
  req: Request,
  res: Response,
) => {
  try {
    const news = await getNewsBySlug(
      req.params.slug,
    );

    if (!news || news.status !== "PUBLISHED") {
      res.status(404).json({
        success: false,
        message: "News not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error) {
    console.error(
      "Failed to fetch public news:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
};