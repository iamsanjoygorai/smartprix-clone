import { Router } from "express";

import {
  createSpecificationSchemaController,
  deleteSpecificationSchemaController,
  getSpecificationSchemaByIdController,
  getSpecificationSchemaBySlugController,
  listSpecificationSchemasController,
  updateSpecificationSchemaController,
} from "../modules/specifications/specification.controller";

import { requirePermission } from "../middlewares/require-permission";
import { PERMISSIONS } from "../config/permissions";

const router = Router();

/**
 * GET /admin/specification-schemas
 *
 * List all active specification schemas.
 */
router.get(
  "/",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  listSpecificationSchemasController,
);

/**
 * GET /admin/specification-schemas/slug/:slug
 *
 * Get a specification schema by slug.
 *
 * IMPORTANT:
 * Keep this route before /:id so "slug" is not treated as an ID.
 */
router.get(
  "/slug/:slug",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  getSpecificationSchemaBySlugController,
);

/**
 * GET /admin/specification-schemas/:id
 *
 * Get a specification schema by ID.
 */
router.get(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  getSpecificationSchemaByIdController,
);

/**
 * POST /admin/specification-schemas
 *
 * Create a specification schema.
 */
router.post(
  "/",
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  createSpecificationSchemaController,
);

/**
 * PUT /admin/specification-schemas/:id
 *
 * Update a specification schema.
 */
router.put(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  updateSpecificationSchemaController,
);

/**
 * DELETE /admin/specification-schemas/:id
 *
 * Deactivate a specification schema.
 */
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_DELETE),
  deleteSpecificationSchemaController,
);

export default router;