import { z } from "zod";

export const productSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Product slug is required"),
});

export type ProductSlugParams = z.infer<
  typeof productSlugSchema
>;