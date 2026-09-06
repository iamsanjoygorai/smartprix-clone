import type { Request, Response } from "express";

import prisma from "../db/prisma";
import { createAuditLog } from "../services/audit.service";

export const getSettings = async (
  _req: Request,
  res: Response,
) => {
  try {
    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
    });
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user || typeof req.user === "string") {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const actorUserId = req.user.userId;

    const {
      siteName,
      siteDescription,
      maintenanceMode,
    } = req.body ?? {};

    let settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {},
      });
    }

    // Save old values before update
    const oldSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      maintenanceMode: settings.maintenanceMode,
    };

    settings = await prisma.siteSettings.update({
      where: {
        id: settings.id,
      },
      data: {
        ...(siteName !== undefined && {
          siteName,
        }),

        ...(siteDescription !== undefined && {
          siteDescription,
        }),

        ...(maintenanceMode !== undefined && {
          maintenanceMode: Boolean(maintenanceMode),
        }),
      },
    });

    // Save audit log
    await createAuditLog({
      actorUserId,
      action: "SETTINGS_UPDATED",
      metadata: {
        oldSettings,
        newSettings: {
          siteName: settings.siteName,
          siteDescription: settings.siteDescription,
          maintenanceMode: settings.maintenanceMode,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Update settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};