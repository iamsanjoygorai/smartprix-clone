import { z } from "zod";

export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .min(10, "Product description must be at least 10 characters")
    .optional(),

  brandSlug: z
    .string()
    .trim()
    .min(1, "Brand is required")
    .optional(),

  categorySlug: z
    .string()
    .trim()
    .min(1, "Category is required")
    .optional(),

  images: z
  .array(z.string().trim().min(1))
  .max(10, "Maximum 10 images are allowed")
  .optional(),

  price: z
    .number()
    .positive("Price must be greater than 0")
    .optional(),

  sellerSlug: z
    .string()
    .trim()
    .min(1, "Seller is required")
    .optional(),

  specifications: z
    .record(z.string(), z.string().trim().min(1))
    .optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;