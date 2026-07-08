import z from "zod";
import { TPaymentStatus } from "../../../../generated/prisma/enums";

//Create payment session
export const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.uuid("Invalid booking id"),
  }),
});

//Payment history filter
export const listPaymentsSchema = z.object({
  query: z.object({
    status: z.enum(TPaymentStatus).optional(),
    period: z.number().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

//Payment details param
export const paymentIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid payment id"),
  }),
});

export type TCreatePaymentPayload = z.infer<typeof createPaymentSchema>["body"];
export type TListPaymentsQuery = z.infer<typeof listPaymentsSchema>["query"];
