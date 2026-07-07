import z from "zod";

//Create payment session
export const createPaymentSchema = z.object({
  body: z.object({
    bookingId: z.uuid("Invalid booking id"),
  }),
});
export type TCreatePaymentPayload = z.infer<typeof createPaymentSchema>["body"];
