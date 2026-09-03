import { Router } from "express";

import { createProduct } from "../controllers/admin-product.controller";
import { getAllAdminProducts } from "../controllers/admin-product-list.controller";
import { getAdminProduct } from "../controllers/admin-product-get.controller";
import { updateProduct } from "../controllers/admin-product-update.controller";
import { deleteProduct } from "../controllers/admin-product-delete.controller";
import { restoreProduct } from "../controllers/admin-product-restore.controller";

const router = Router();

router.get("/products", getAllAdminProducts);
router.post("/products", createProduct);
router.get("/products/:id", getAdminProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.patch("/products/:id/restore", restoreProduct);

export default router;