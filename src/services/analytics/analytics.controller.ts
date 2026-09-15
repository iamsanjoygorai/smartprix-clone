import type { Request, Response } from "express";

import {
  getAnalyticsOverview,
  getAnalyticsUsers,
  getAnalyticsUserGrowth,
  getAnalyticsProducts,
  getAnalyticsProductGrowth,
  getAnalyticsEngagement,
  getAnalyticsActivity,
} from "./analytics.service";

import {
  getAnalyticsTopProducts,
   getAnalyticsSearches,
} from "./analytics.service";

export const getAnalyticsOverviewController = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const data = await getAnalyticsOverview();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      "Failed to fetch analytics overview:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics overview",
    });
  }
};


export const getAnalyticsUsersController = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const data = await getAnalyticsUsers();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      "Failed to fetch user analytics:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user analytics",
    });
  }
};


export const getAnalyticsUserGrowthController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const daysParam = req.query.days;

    const days =
      typeof daysParam === "string"
        ? Number(daysParam)
        : 30;

    const data = await getAnalyticsUserGrowth(days);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      "Failed to fetch user growth analytics:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user growth analytics",
    });
  }
};


export const getAnalyticsProductsController = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const data = await getAnalyticsProducts();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      "Failed to fetch product analytics:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product analytics",
    });
  }
};

export const getAnalyticsProductGrowthController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const daysParam = req.query.days;

    const days =
      typeof daysParam === "string"
        ? Number(daysParam)
        : 30;

    const data = await getAnalyticsProductGrowth(days);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      "Failed to fetch product growth analytics:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product growth analytics",
    });
  }
};


export const getAnalyticsTopProductsController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const days =
      typeof req.query.days === "string"
        ? Number(req.query.days)
        : 30;

    const data = await getAnalyticsTopProducts(days);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      "Get analytics top products error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch top products analytics",
    });
  }
};


export const getAnalyticsSearchesController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const days =
      typeof req.query.days === "string"
        ? Number(req.query.days)
        : 30;

    const data = await getAnalyticsSearches(days);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      "Get analytics searches error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch search analytics",
    });
  }
};

export const getAnalyticsEngagementController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const days =
      typeof req.query.days === "string"
        ? Number(req.query.days)
        : 30;

    const data = await getAnalyticsEngagement(days);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      "Get analytics engagement error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch engagement analytics",
    });
  }
};

export const getAnalyticsActivityController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const days =
      typeof req.query.days === "string"
        ? Number(req.query.days)
        : 30;

    const data = await getAnalyticsActivity(days);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error(
      "Get analytics activity error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity analytics",
    });
  }
};