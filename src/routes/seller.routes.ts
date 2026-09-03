import { Router } from "express";

import prisma from "../db/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const sellers = await prisma.seller.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: sellers,
    });
  } catch (error) {
    console.error("Failed to fetch sellers:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch sellers",
    });
  }
});

export default router;