import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    slug: z.string().trim().min(2).max(120).optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.uuid("Invalid category id"),
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      description: z.string().trim().max(2000),
      isActive: z.boolean(),
    })
    .partial(),
});

export type TCreateCategoryPayload = z.infer<
  typeof createCategorySchema
>["body"];
export type TUpdateCategoryPayload = z.infer<
  typeof updateCategorySchema
>["body"];
