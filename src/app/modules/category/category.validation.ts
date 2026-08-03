import { z } from "zod";
import { recordStatusQuerySchema } from "../../../utils/recordStatus";
import { TMaintenanceType } from "../../../../generated/prisma/enums";

const categoryImageUrlSchema = z
  .url("Image must be a valid URL")
  .max(2048, "Image URL is too long");

const commonIssuesSchema = z
  .array(z.string().trim().min(3).max(160))
  .max(12, "A category cannot list more than 12 common issues");

const maintenanceIntervalSchema = z.coerce
  .number()
  .int()
  .min(1, "Interval must be at least 1 day")
  .max(3650, "Interval cannot exceed 10 years");

export const createCategorySchema = z
  .object({
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
      coverImage: categoryImageUrlSchema.optional(),
      tagline: z
        .string()
        .trim()
        .max(200, "Tagline cannot exceed 200 characters")
        .optional(),
      overview: z
        .string()
        .trim()
        .max(4000, "Overview cannot exceed 4000 characters")
        .optional(),
      commonIssues: commonIssuesSchema.optional(),
      isActive: z.boolean().optional(),
      maintenanceType: z.enum(TMaintenanceType).optional(),
      maintenanceIntervalDays: maintenanceIntervalSchema.optional(),
    }),
  })
  .refine(
    (payload) =>
      payload.body.maintenanceType !== TMaintenanceType.RECURRING ||
      payload.body.maintenanceIntervalDays !== undefined,
    {
      message: "A recurring category needs a maintenance interval in days",
      path: ["body", "maintenanceIntervalDays"],
    },
  );

export const updateCategorySchema = z
  .object({
    params: z.object({
      id: z.uuid("Invalid category id"),
    }),
    body: z
      .object({
        name: z.string().trim().min(2).max(100),
        description: z.string().trim().max(2000),
        image: categoryImageUrlSchema.nullable(),
        coverImage: categoryImageUrlSchema.nullable(),
        tagline: z.string().trim().max(200).nullable(),
        overview: z.string().trim().max(4000).nullable(),
        commonIssues: commonIssuesSchema,
        isActive: z.boolean(),
        maintenanceType: z.enum(TMaintenanceType),
        maintenanceIntervalDays: maintenanceIntervalSchema.nullable(),
      })
      .partial(),
  })
  .refine(
    (payload) =>
      payload.body.maintenanceType !== TMaintenanceType.RECURRING ||
      !!payload.body.maintenanceIntervalDays,
    {
      message: "A recurring category needs a maintenance interval in days",
      path: ["body", "maintenanceIntervalDays"],
    },
  );

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid category id"),
  }),
});

export const categorySlugParamSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1).max(120),
  }),
});

export const listCategoryPublicSchema = z.object({
  query: z.object({
    sort: z.enum(["name", "popular", "trending"]).optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
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
export type TListCategoryPublicQuery = z.infer<
  typeof listCategoryPublicSchema
>["query"];
