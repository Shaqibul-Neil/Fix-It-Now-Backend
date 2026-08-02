import { z } from "zod";
import { recordStatusQuerySchema } from "../../../utils/recordStatus";

const categoryImageUrlSchema = z
  .url("Image must be a valid URL")
  .max(2048, "Image URL is too long");

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
    image: categoryImageUrlSchema.optional(),
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
      image: categoryImageUrlSchema.nullable(),
      isActive: z.boolean(),
    })
    .partial(),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid category id"),
  }),
});

// Admin table — search box, the active/paused/deleted tab, and paging.
export const listCategoryAdminSchema = z.object({
  query: z.object({
    search: z.string().trim().min(1).max(120).optional(),
    status: recordStatusQuerySchema,
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export type TCreateCategoryPayload = z.infer<
  typeof createCategorySchema
>["body"];
export type TUpdateCategoryPayload = z.infer<
  typeof updateCategorySchema
>["body"];
export type TListCategoryAdminQuery = z.infer<
  typeof listCategoryAdminSchema
>["query"];
