import z from "zod";
import { TPaymentStatus } from "../../../../generated/prisma/enums";
import { PERIODS } from "../../../types/types";

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
    period: z
      .enum(PERIODS)
      .transform((value) => Number(value))
      .optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

//Admin payment filter — the shared filters plus a payer/reference search.
//Kept separate so `search` can never reach a customer's own history, where it
//would let them probe rows the customerId gate is meant to hide.
export const adminListPaymentsSchema = z.object({
  query: z.object({
    status: z.enum(TPaymentStatus).optional(),
    period: z
      .enum(PERIODS)
      .transform((value) => Number(value))
      .optional(),
    search: z.string().trim().min(1).optional(),
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
export type TAdminListPaymentsQuery = z.infer<
  typeof adminListPaymentsSchema
>["query"];
