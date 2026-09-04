import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name is required"),

  description: z
    .string()
    .trim()
    .optional()
    .default(""),

  brandSlug: z
    .string()
    .trim()
    .min(1, "Brand is required"),

  categorySlug: z
    .string()
    .trim()
    .min(1, "Category is required"),

  images: z
    .array(z.string().trim().min(1))
    .max(10, "Maximum 10 images are allowed")
    .optional(),

  price: z
    .number()
    .positive("Price must be greater than 0"),

  sellerSlug: z
    .string()
    .trim()
    .min(1, "Seller is required"),

  specifications: z
    .record(z.string(), z.string().trim().min(1))
    .default({}),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;