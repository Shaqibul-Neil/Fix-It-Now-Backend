import { z } from "zod";

//Service Creation Validation
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

//Service Update Validation
export const updateServiceSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid service id"),
  }),
  body: z
    .object({
      categoryId: z.uuid("Invalid category id"),
      title: z
        .string()
        .trim()
        .min(3, "Title must be at least 3 characters")
        .max(150, "Title cannot exceed 150 characters"),
      description: z
        .string()
        .trim()
        .max(2000, "Description cannot exceed 2000 characters"),
      price: z.number().positive("Price must be greater than 0"),
      estimatedDuration: z
        .number()
        .int("Duration must be a whole number (minutes)")
        .positive("Duration must be greater than 0"),
      isActive: z.boolean(),
    })
    .partial(),
});

// Admin moderation — can only flip visibility
export const moderateServiceSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid service id"),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const listServicesSchema = z.object({
  query: z.object({
    categoryId: z.uuid("Invalid category id").optional(),
    search: z.string().trim().min(1).max(150).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export type TCreateServicePayload = z.infer<typeof createServiceSchema>["body"];
export type TUpdateServicePayload = z.infer<typeof updateServiceSchema>["body"];
export type TListServicesQuery = z.infer<typeof listServicesSchema>["query"];
