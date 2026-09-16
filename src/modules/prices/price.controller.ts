import type {
  Request,
  Response,
} from "express";

import {
  getProductPrices,
  getProductPriceHistory,
  getBestPrice,
  getPriceStatistics,
} from "./price.service";

/* =========================================================
   GET CURRENT PRICES
========================================================= */

export const getPrices = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug =
      typeof req.params.slug === "string"
        ? req.params.slug
        : undefined;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });

      return;
    }

    const prices =
      await getProductPrices(slug);

    res.status(200).json({
      success: true,
      data: prices,
    });
  } catch (error) {
    console.error(
      "Failed to fetch product prices:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Product not found"
    ) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch product prices",
    });
  }
};

/* =========================================================
   GET PRICE HISTORY
========================================================= */

export const getPriceHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug =
      typeof req.params.slug === "string"
        ? req.params.slug
        : undefined;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });

      return;
    }

    const history =
      await getProductPriceHistory(slug);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error(
      "Failed to fetch price history:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Product not found"
    ) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch price history",
    });
  }
};

/* =========================================================
   GET BEST PRICE
========================================================= */

export const getBestPriceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug =
      typeof req.params.slug === "string"
        ? req.params.slug
        : undefined;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });

      return;
    }

    const price =
      await getBestPrice(slug);

    res.status(200).json({
      success: true,
      data: price,
    });
  } catch (error) {
    console.error(
      "Failed to fetch best price:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Product not found"
    ) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch best price",
    });
  }
};

/* =========================================================
   GET PRICE STATISTICS
========================================================= */

export const getPriceStatisticsController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const slug =
        typeof req.params.slug === "string"
          ? req.params.slug
          : undefined;

      if (!slug) {
        res.status(400).json({
          success: false,
          message: "Product slug is required",
        });

        return;
      }

      const statistics =
        await getPriceStatistics(slug);

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error(
        "Failed to fetch price statistics:",
        error,
      );

      if (
        error instanceof Error &&
        error.message === "Product not found"
      ) {
        res.status(404).json({
          success: false,
          message: "Product not found",
        });

        return;
      }

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch price statistics",
      });
    }
  };