import type { Request, Response } from "express";

import {
  createPriceAlertSchema,
  priceAlertIdSchema,
  updatePriceAlertSchema,
} from "./price-alert.validation";

import {
  createPriceAlert,
  deletePriceAlert,
  getUserPriceAlert,
  getUserPriceAlerts,
  updatePriceAlert,
} from "./price-alert.service";

/* =========================================================
   GET AUTHENTICATED USER ID
========================================================= */

const getAuthenticatedUserId = (
  req: Request,
): string => {
  if (
    !req.user ||
    typeof req.user === "string" ||
    !req.user.userId
  ) {
    throw new Error("Unauthorized");
  }

  return req.user.userId;
};

/* =========================================================
   CREATE PRICE ALERT
   POST /api/price-alerts
========================================================= */

export const createPriceAlertController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const parsed =
      createPriceAlertSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: parsed.error.flatten(),
      });
    }

    const alert = await createPriceAlert(
      userId,
      parsed.data,
    );

    return res.status(201).json({
      success: true,
      message: "Price alert created successfully",
      data: alert,
    });
  } catch (error) {
    console.error(
      "Create price alert error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (
      error instanceof Error &&
      error.message === "Product not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create price alert",
    });
  }
};

/* =========================================================
   GET USER PRICE ALERTS
   GET /api/price-alerts
========================================================= */

export const getPriceAlertsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const alerts =
      await getUserPriceAlerts(userId);

    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error(
      "Get price alerts error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch price alerts",
    });
  }
};

/* =========================================================
   GET SINGLE PRICE ALERT
   GET /api/price-alerts/:id
========================================================= */

export const getPriceAlertController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const parsed =
      priceAlertIdSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid price alert ID",
        errors: parsed.error.flatten(),
      });
    }

    const alert =
      await getUserPriceAlert(
        userId,
        parsed.data.id,
      );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Price alert not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error(
      "Get price alert error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch price alert",
    });
  }
};

/* =========================================================
   UPDATE PRICE ALERT
   PATCH /api/price-alerts/:id
========================================================= */

export const updatePriceAlertController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const params =
      priceAlertIdSchema.safeParse(req.params);

    if (!params.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid price alert ID",
        errors: params.error.flatten(),
      });
    }

    const body =
      updatePriceAlertSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: body.error.flatten(),
      });
    }

    const alert =
      await updatePriceAlert(
        userId,
        params.data.id,
        body.data,
      );

    return res.status(200).json({
      success: true,
      message: "Price alert updated successfully",
      data: alert,
    });
  } catch (error) {
    console.error(
      "Update price alert error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (
      error instanceof Error &&
      error.message === "Price alert not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Price alert not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update price alert",
    });
  }
};

/* =========================================================
   DELETE PRICE ALERT
   DELETE /api/price-alerts/:id
========================================================= */

export const deletePriceAlertController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = getAuthenticatedUserId(req);

    const parsed =
      priceAlertIdSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid price alert ID",
        errors: parsed.error.flatten(),
      });
    }

    await deletePriceAlert(
      userId,
      parsed.data.id,
    );

    return res.status(200).json({
      success: true,
      message: "Price alert deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete price alert error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Unauthorized"
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (
      error instanceof Error &&
      error.message === "Price alert not found"
    ) {
      return res.status(404).json({
        success: false,
        message: "Price alert not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete price alert",
    });
  }
};