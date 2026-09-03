import { Router } from "express";

import productRoutes from "./product.routes";
import comparisonRoutes from "./comparison.routes";
import categoryRoutes from "./category.routes";
import brandRoutes from "./brand.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Smartprix Clone API is running",
  });
});

router.use("/products", productRoutes);
router.use("/comparisons", comparisonRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);

export default router;