import type { Request, Response } from "express";

import prisma from "../../db/prisma";
import { runPriceAlertJobWithPrisma } from "./price-alert.job";

type PriceAlertJobRunner = () => ReturnType<
  typeof runPriceAlertJobWithPrisma
>;

export const processPriceAlerts = async (
  _req: Request,
  res: Response,
  runJob: PriceAlertJobRunner = () =>
    runPriceAlertJobWithPrisma(prisma),
) => {
  try {
    const result = await runJob();

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ Admin Price Alert processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process price alerts",
    });
  }
};