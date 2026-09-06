import { Router } from "express";

import { createProduct } from "../controllers/admin-product.controller";
import { getAllAdminProducts } from "../controllers/admin-product-list.controller";
import { getAdminProduct } from "../controllers/admin-product-get.controller";
import { updateProduct } from "../controllers/admin-product-update.controller";
import { deleteProduct } from "../controllers/admin-product-delete.controller";
import { restoreProduct } from "../controllers/admin-product-restore.controller";
import { uploadProductImages } from "../controllers/admin-product-image.controller";

import { productImageUpload } from "../middlewares/upload.middleware";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

// View all products
router.get(
  "/products",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  getAllAdminProducts,
);

// Upload product images
router.post(
  "/products/upload-images",
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  productImageUpload.array("images", 10),
  uploadProductImages,
);

// Create product
router.post(
  "/products",
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  createProduct,
);

// View single product
router.get(
  "/products/:id",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  getAdminProduct,
);

// Update product
router.put(
  "/products/:id",
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  updateProduct,
);

// Delete product
router.delete(
  "/products/:id",
  requirePermission(PERMISSIONS.PRODUCTS_DELETE),
  deleteProduct,
);

// Restore product
router.patch(
  "/products/:id/restore",
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  restoreProduct,
);

export default router;