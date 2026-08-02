import { z } from "zod";
import {
  TTechnicianApprovalStatus,
  TUserStatus,
} from "../../../../generated/prisma/enums";
import { includeDeletedQuerySchema } from "../../../utils/recordStatus";

//Check box group
const multiValueQuery = <T extends z.ZodType>(item: T) =>
  z
    .preprocess(
      (value) =>
        value === undefined || Array.isArray(value) ? value : [value],
      z.array(item),
    )
    .optional();

const booleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

export const PRICE_BUCKET = [
  "under_500",
  "500_1000",
  "1000_2000",
  "2000_plus",
] as const;

export const TECHNICIAN_SORT = [
  "best_match",
  "top_rated",
  "most_reviewed",
  "price_low",
  "price_high",
  "newest",
] as const;

const MIN_AGE_YEARS = 18;

const isAdult = (date: Date) => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE_YEARS);
  return date <= cutoff;
};

const basicInfoSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(6, "Phone number is too short")
    .max(11, "Phone number is too long"),
  avatar: z.url("Avatar must be a valid URL").max(2048).nullable().optional(),
  coverImage: z
    .url("Cover image must be a valid URL")
    .max(2048)
    .nullable()
    .optional(),
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

const identitySchema = z.object({
  nationalId: z
    .string()
    .trim()
    .regex(
      /^(\d{10}|\d{13}|\d{17})$/,
      "National ID must be 10, 13 or 17 digits",
    ),
  nidDocument: z
    .url("NID document must be a valid URL")
    .max(2048)
    .nullable()
    .optional(),
  passportNumber: z
    .string()
    .trim()
    .min(6, "Passport number is too short")
    .max(20, "Passport number is too long")
    .nullable()
    .optional(),
  dateOfBirth: z.coerce
    .date()
    .refine(isAdult, `Technician must be at least ${MIN_AGE_YEARS} years old`)
    .nullable()
    .optional(),
  emergencyContactName: z
    .string()
    .trim()
    .min(2, "Emergency contact name is too short")
    .max(100)
    .nullable()
    .optional(),
  emergencyContactPhone: z
    .string()
    .trim()
    .min(6, "Emergency contact phone is too short")
    .max(20)
    .nullable()
    .optional(),
});

const pricingSchema = z.object({
  hourlyRate: z.number().positive("Hourly rate must be greater than 0"),
  serviceRadius: z
    .number()
    .int("Service radius must be a whole number")
    .positive("Service radius must be greater than 0")
    .optional(),
  offersEmergencyService: z.boolean().optional(),
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

const profileDetailsSchema = z.object({
  professionalTitle: z
    .string()
    .trim()
    .min(2, "Professional title is too short")
    .max(120)
    .nullable()
    .optional(),
  tagline: z.string().trim().max(300).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  workHighlights: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
});

export const createTechnicianProfileSchema = z.object({
  body: z.object({
    basicInfo: basicInfoSchema,
    identity: identitySchema,
    pricing: pricingSchema,
    location: locationSchema,
    profileDetails: profileDetailsSchema.optional(),
  }),
});

export const updateTechnicianProfileSchema = z.object({
  body: z.object({
    basicInfo: basicInfoSchema.partial().optional(),
    identity: identitySchema.partial().optional(),
    pricing: pricingSchema.partial().optional(),
    location: locationSchema.partial().optional(),
    profileDetails: profileDetailsSchema.optional(),
  }),
});

// The technician's own "am I taking work right now" switch. Kept out of updateTechnicianProfileSchema on purpose: that one is the onboarding form and its fields are reviewed by an admin, while this is a toggle flipped several times a week and reviewed by nobody.
export const updateAvailabilityStatusSchema = z.object({
  body: z.object({
    isAvailable: z.boolean(),
  }),
});

// Admin promotes or demotes a technician on the public list.
export const updateFeaturedStatusSchema = z.object({
  params: z.object({ id: z.uuid("Invalid technician id") }),
  body: z.object({ isFeatured: z.boolean() }),
});

// what both lists filter the same way
const baseListQuerySchema = z.object({
  search: z.string().trim().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

// Public list — the filter sidebar.
export const listTechniciansSchema = z.object({
  query: baseListQuerySchema.extend({
    city: multiValueQuery(z.string().trim().min(1)),
    sort: z.enum(TECHNICIAN_SORT).optional(),
    categoryIds: multiValueQuery(z.uuid("Invalid category id")),
    skills: multiValueQuery(z.string().trim().min(1)),
    priceBuckets: multiValueQuery(z.enum(PRICE_BUCKET)),

    acceptingClients: booleanQuery,
    eveningAvailable: booleanQuery,
    weekendAvailable: booleanQuery,
    emergencyService: booleanQuery,
    featured: booleanQuery,
  }),
});

export const technicianIdParamSchema = z.object({
  params: z.object({ id: z.uuid("Invalid technician id") }),
});

// Admin list — a moderation table. Single-value city and area, no checkbox
// groups, no sort. Deliberately not extended from the public query, so a filter
// added to the sidebar tomorrow does not silently land on the admin table too.
export const adminListTechniciansSchema = z.object({
  query: baseListQuerySchema.extend({
    city: z.string().trim().optional(),
    approvalStatus: z.enum(TTechnicianApprovalStatus).optional(),
    accountStatus: z.enum(TUserStatus).optional(),
    featured: booleanQuery,
    includeDeleted: includeDeletedQuerySchema,
  }),
});

// Admin approves or rejects a submitted onboarding.
export const reviewTechnicianSchema = z.object({
  params: z.object({ id: z.uuid("Invalid technician id") }),
  body: z
    .object({
      status: z.enum([
        TTechnicianApprovalStatus.APPROVED,
        TTechnicianApprovalStatus.REJECTED,
      ]),
      rejectionReason: z
        .string()
        .trim()
        .min(10, "Rejection reason must be at least 10 characters")
        .max(500, "Rejection reason cannot exceed 500 characters")
        .optional(),
    })
    .refine(
      (body) =>
        body.status !== TTechnicianApprovalStatus.REJECTED ||
        Boolean(body.rejectionReason),
      {
        message: "A reason is required when rejecting a technician.",
        path: ["rejectionReason"],
      },
    ),
});

export type TBaseListTechniciansQuery = z.infer<typeof baseListQuerySchema>;

export type TListTechniciansQuery = z.infer<
  typeof listTechniciansSchema
>["query"];

export type TCreateTechnicianProfilePayload = z.infer<
  typeof createTechnicianProfileSchema
>["body"];

export type TUpdateTechnicianProfilePayload = z.infer<
  typeof updateTechnicianProfileSchema
>["body"];

export type TUpdateAvailabilityStatusPayload = z.infer<
  typeof updateAvailabilityStatusSchema
>["body"];

export type TUpdateFeaturedStatusPayload = z.infer<
  typeof updateFeaturedStatusSchema
>["body"];

export type TAdminListTechniciansQuery = z.infer<
  typeof adminListTechniciansSchema
>["query"];

export type TReviewTechnicianPayload = z.infer<
  typeof reviewTechnicianSchema
>["body"];

export type TTechnicianSort = (typeof TECHNICIAN_SORT)[number];
export type TPriceBucket = (typeof PRICE_BUCKET)[number];
