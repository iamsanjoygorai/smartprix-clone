import { z } from "zod";

export const createPriceAlertSchema = z.object({
  productId: z
    .string()
    .trim()
    .min(1, "Product ID is required"),

  targetPrice: z
    .number()
    .positive("Target price must be greater than 0"),

  currency: z
    .string()
    .trim()
    .min(3, "Currency must be at least 3 characters")
    .max(3, "Currency must be exactly 3 characters")
    .optional()
    .default("INR"),
});

export const updatePriceAlertSchema = z
  .object({
    targetPrice: z
      .number()
      .positive("Target price must be greater than 0")
      .optional(),

    isActive: z
      .boolean()
      .optional(),
  })
  .refine(
    (data) =>
      data.targetPrice !== undefined ||
      data.isActive !== undefined,
    {
      message:
        "At least one field must be provided",
    },
  );

export const priceAlertIdSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Price alert ID is required"),
});

export type CreatePriceAlertInput = z.infer<
  typeof createPriceAlertSchema
>;

export type UpdatePriceAlertInput = z.infer<
  typeof updatePriceAlertSchema
>;