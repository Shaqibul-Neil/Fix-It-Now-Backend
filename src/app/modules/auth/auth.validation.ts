import { z } from "zod";
import { TRole } from "../../../../generated/prisma/enums";

export const registerValidationSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(1, "First Name cannot be empty")
      .max(50, "First Name cannot exceed 50 characters"),

    lastName: z
      .string()
      .trim()
      .min(1, "Last Name cannot be empty")
      .max(50, "Last Name cannot exceed 50 characters"),

    role: z.enum([TRole.CUSTOMER, TRole.TECHNICIAN]).default(TRole.CUSTOMER),

    email: z.email("Invalid email address").trim().toLowerCase(),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),
});

export const loginValidationSchema = z.object({
  body: z.object({
    email: z.email("Email is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export type TRegisterUserPayload = z.infer<
  typeof registerValidationSchema
>["body"];

export type TLoginUserPayload = z.infer<typeof loginValidationSchema>["body"];
