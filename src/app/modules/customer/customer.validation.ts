import z from "zod";

export const updateCustomerProfileSchema = z.object({
  body: z.object({
    phone: z.string().trim().max(20).optional(),
    avatar: z.url("Avatar must be a valid URL").max(2048).nullable().optional(),
    defaultAddress: z.string().trim().optional(),
    city: z.string().trim().max(100).optional(),
    area: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(20).optional(),
  }),
});

export type TUpdateCustomerProfilePayload = z.infer<
  typeof updateCustomerProfileSchema
>["body"];
