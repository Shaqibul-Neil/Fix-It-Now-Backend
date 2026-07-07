import z from "zod";
import { TBookingStatus } from "../../../../generated/prisma/enums";

//Public Booking Creation
export const createBookingSchema = z.object({
  body: z.object({
    serviceId: z.uuid("Invalid service id"),
    scheduledAt: z.coerce
      .date({ message: " Scheduled At must be a valid date" })
      .refine((d) => d.getTime() > Date.now(), {
        message: "Scheduled At must be in the future",
      }),
    address: z
      .string()
      .trim()
      .min(1, "Address is required")
      .max(500, "Address cannot exceed 500 characters"),
    city: z.string().trim().max(100).optional(),
    area: z.string().trim().max(100).optional(),
    notes: z.string().trim().max(2000).optional(),
  }),
});

//Public Booking Cancel
export const bookingIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid booking id"),
  }),
});

//Booking Filter
export const listBookingsSchema = z.object({
  query: z.object({
    status: z.enum(TBookingStatus).optional(),
    category: z.string().trim().min(1).max(120).optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

//Technician Booking Status Update
export const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid booking id"),
  }),
  body: z.object({
    status: z.enum([
      TBookingStatus.ACCEPTED,
      TBookingStatus.DECLINED,
      TBookingStatus.IN_PROGRESS,
      TBookingStatus.COMPLETED,
    ]),
    note: z.string().trim().max(500).optional(),
  }),
});

export type TCreateBookingPayload = z.infer<typeof createBookingSchema>["body"];
export type TListBookingsQuery = z.infer<typeof listBookingsSchema>["query"];
export type TUpdateBookingStatusPayload = z.infer<
  typeof updateBookingStatusSchema
>["body"];
