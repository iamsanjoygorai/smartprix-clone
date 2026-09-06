import { Request, Response } from "express";
import { getAdminDashboard } from "../services/admin-dashboard.service";

export const getDashboard = async (
  _req: Request,
  res: Response,
) => {
  try {
    const dashboard = await getAdminDashboard();

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    console.error("Failed to load admin dashboard:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
    });
  }
};