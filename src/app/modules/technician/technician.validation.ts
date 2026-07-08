import { z } from "zod";

const basicInfoSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(6, "Phone number is too short")
    .max(11, "Phone number is too long"),
  avatar: z.url("Avatar must be a valid URL").optional(),
  bio: z
    .string()
    .trim()
    .min(10, "Bio must be at least 10 characters")
    .max(1000, "Bio cannot exceed 1000 characters"),
  experienceYears: z
    .number()
    .int("Experience must be a whole number")
    .min(0, "Experience cannot be negative")
    .max(60, "Experience years seems too high"),
});

const pricingSchema = z.object({
  hourlyRate: z.number().positive("Hourly rate must be greater than 0"),
  serviceRadius: z
    .number()
    .int("Service radius must be a whole number")
    .positive("Service radius must be greater than 0")
    .optional(),
});

const locationSchema = z.object({
  address: z
    .string()
    .trim()
    .min(5, "Address is too short")
    .max(255, "Address is too long"),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100, "City name is too long"),
  area: z
    .string()
    .trim()
    .min(2, "Area is required")
    .max(100, "Area name is too long"),
});

export const createTechnicianProfileSchema = z.object({
  body: z.object({
    basicInfo: basicInfoSchema,
    pricing: pricingSchema,
    location: locationSchema,
  }),
});

export const updateTechnicianProfileSchema = z.object({
  body: z.object({
    basicInfo: basicInfoSchema.partial().optional(),
    pricing: pricingSchema.partial().optional(),
    location: locationSchema.partial().optional(),
  }),
});

export const listTechniciansSchema = z.object({
  query: z.object({
    city: z.string().trim().optional(),
    search: z.string().trim().optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const technicianIdParamSchema = z.object({
  params: z.object({ id: z.uuid("Invalid technician id") }),
});

export type TListTechniciansQuery = z.infer<
  typeof listTechniciansSchema
>["query"];

export type TCreateTechnicianProfilePayload = z.infer<
  typeof createTechnicianProfileSchema
>["body"];

export type TUpdateTechnicianProfilePayload = z.infer<
  typeof updateTechnicianProfileSchema
>["body"];
