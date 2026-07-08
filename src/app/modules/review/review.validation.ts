import z from "zod";
import { TReviewStatus } from "../../../../generated/prisma/enums";

// Customer: create review
export const createReviewSchema = z.object({
  body: z.object({
    bookingId: z.uuid("Invalid booking id"),
    rating: z.coerce
      .number()
      .int()
      .min(1, "Rating must be between 1 and 5")
      .max(5, "Rating must be between 1 and 5"),
    comment: z.string().trim().max(2000).optional(),
  }),
});

// Customer: update own review
export const updateReviewSchema = z.object({
  params: z.object({ id: z.uuid("Invalid review id") }),
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(2000).optional(),
  }),
});

// Admin: moderate status
export const updateReviewStatusSchema = z.object({
  params: z.object({ id: z.uuid("Invalid review id") }),
  body: z.object({ status: z.enum(TReviewStatus) }),
});

//Review Filter
export const listReviewSchema = z.object({
  query: z.object({
    status: z.enum(TReviewStatus).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export type TCreateReviewPayload = z.infer<typeof createReviewSchema>["body"];
export type TUpdateReviewPayload = z.infer<typeof updateReviewSchema>["body"];
export type TUpdateReviewStatusPayload = z.infer<
  typeof updateReviewStatusSchema
>["body"];

export type TListReviewQuery = z.infer<typeof listReviewSchema>["query"];
