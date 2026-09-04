import { z } from "zod";

const newsBlockSchema = z.object({
  id: z.string().optional(),

  type: z.string().min(1),

  position: z.number().int().min(0),

  content: z.unknown(),
});

export const createNewsSchema = z.object({
  title: z.string().trim().min(1).max(300),

  authorName: z.string().trim().min(1).max(150),

  featuredImage: z.string().trim().optional(),

  status: z
    .enum(["DRAFT", "PUBLISHED"])
    .default("DRAFT"),

  allowLikes: z.boolean().default(true),

  allowComments: z.boolean().default(true),

  allowSharing: z.boolean().default(true),

  blocks: z.array(newsBlockSchema).default([]),
});

export const updateNewsSchema =
  createNewsSchema.partial();

export type CreateNewsInput =
  z.infer<typeof createNewsSchema>;

export type UpdateNewsInput =
  z.infer<typeof updateNewsSchema>;