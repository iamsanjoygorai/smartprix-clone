import { Request, Response } from "express";

import {
  createSpecificationSchema,
  deleteSpecificationSchema,
  getSpecificationSchemaById,
  getSpecificationSchemaBySlug,
  listSpecificationSchemas,
  updateSpecificationSchema,
} from "./specification.service";

/**
 * POST /admin/specification-schemas
 *
 * Create a specification schema.
 */
export async function createSpecificationSchemaController(
  req: Request,
  res: Response,
) {
  try {
    const schema = await createSpecificationSchema(req.body);

    return res.status(201).json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error(
      "Failed to create specification schema:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create specification schema.",
    });
  }
}

/**
 * GET /admin/specification-schemas
 *
 * List all active specification schemas.
 */
export async function listSpecificationSchemasController(
  _req: Request,
  res: Response,
) {
  try {
    const schemas = await listSpecificationSchemas();

    return res.json({
      success: true,
      data: schemas,
    });
  } catch (error) {
    console.error(
      "Failed to list specification schemas:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to list specification schemas.",
    });
  }
}

/**
 * GET /admin/specification-schemas/:id
 *
 * Get a specification schema by ID.
 */
export async function getSpecificationSchemaByIdController(
  req: Request,
  res: Response,
) {
  try {
    const id =
      typeof req.params.id === "string"
        ? req.params.id
        : "";

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Specification schema ID is required.",
      });
    }

    const schema =
      await getSpecificationSchemaById(id);

    if (!schema) {
      return res.status(404).json({
        success: false,
        message: "Specification schema not found.",
      });
    }

    return res.json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error(
      "Failed to get specification schema:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get specification schema.",
    });
  }
}

/**
 * GET /admin/specification-schemas/slug/:slug
 *
 * Get a specification schema by slug.
 */
export async function getSpecificationSchemaBySlugController(
  req: Request,
  res: Response,
) {
  try {
    const slug =
      typeof req.params.slug === "string"
        ? req.params.slug
        : "";

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Specification schema slug is required.",
      });
    }

    const schema =
      await getSpecificationSchemaBySlug(slug);

    if (!schema) {
      return res.status(404).json({
        success: false,
        message: "Specification schema not found.",
      });
    }

    return res.json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error(
      "Failed to get specification schema by slug:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get specification schema.",
    });
  }
}

/**
 * PUT /admin/specification-schemas/:id
 *
 * Update a specification schema.
 */
export async function updateSpecificationSchemaController(
  req: Request,
  res: Response,
) {
  try {
    const id =
      typeof req.params.id === "string"
        ? req.params.id
        : "";

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Specification schema ID is required.",
      });
    }

    const schema =
      await updateSpecificationSchema(
        id,
        req.body,
      );

    return res.json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error(
      "Failed to update specification schema:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update specification schema.",
    });
  }
}

/**
 * DELETE /admin/specification-schemas/:id
 *
 * Deactivate a specification schema.
 */
export async function deleteSpecificationSchemaController(
  req: Request,
  res: Response,
) {
  try {
    const id =
      typeof req.params.id === "string"
        ? req.params.id
        : "";

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Specification schema ID is required.",
      });
    }

    const schema =
      await deleteSpecificationSchema(id);

    if (!schema) {
      return res.status(404).json({
        success: false,
        message: "Specification schema not found.",
      });
    }

    return res.json({
      success: true,
      data: schema,
      message:
        "Specification schema deactivated successfully.",
    });
  } catch (error) {
    console.error(
      "Failed to deactivate specification schema:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to deactivate specification schema.",
    });
  }
}