import { Router } from "express";

import { createProduct } from "../controllers/admin-product.controller";
import { updateProduct } from "../controllers/admin-product-update.controller";
import { deleteProduct } from "../controllers/admin-product-delete.controller";
import { restoreProduct } from "../controllers/admin-product-restore.controller";

const router = Router();

router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.patch("/products/:id/restore", restoreProduct);

export default router;