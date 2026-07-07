import z from "zod";

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

export type TCreateBookingPayload = z.infer<typeof createBookingSchema>["body"];
