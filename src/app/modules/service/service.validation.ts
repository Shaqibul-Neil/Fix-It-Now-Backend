import { z } from "zod";

export const createServiceSchema = z.object({
  body: z.object({
    categoryId: z.uuid("Invalid category id"),
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(150, "Title cannot exceed 150 characters"),
    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),
    price: z.number().positive("Price must be greater than 0"),
    estimatedDuration: z
      .number()
      .int("Duration must be a whole number (minutes)")
      .positive("Duration must be greater than 0")
      .optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid service id"),
  }),
  body: z
    .object({
      categoryId: z.uuid("Invalid category id"),
      title: z.string().trim().min(3).max(150),
      description: z.string().trim().max(2000),
      price: z.number().positive("Price must be greater than 0"),
      estimatedDuration: z
        .number()
        .int("Duration must be a whole number (minutes)")
        .positive("Duration must be greater than 0"),
      isActive: z.boolean(),
    })
    .partial(),
});

export const serviceIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid service id"),
  }),
});

export const listServicesSchema = z.object({
  query: z.object({
    category: z.string().trim().min(1).max(120).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    area: z.string().trim().min(1).max(100).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    search: z.string().trim().min(1).max(150).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export type TCreateServicePayload = z.infer<typeof createServiceSchema>["body"];
export type TUpdateServicePayload = z.infer<typeof updateServiceSchema>["body"];
export type TListServicesQuery = z.infer<typeof listServicesSchema>["query"];
