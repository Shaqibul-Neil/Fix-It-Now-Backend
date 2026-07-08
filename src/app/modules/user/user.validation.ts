import z from "zod";
import { TRole, TUserStatus } from "../../../../generated/prisma/enums";

export const listUsersSchema = z.object({
  query: z.object({
    role: z.enum(TRole).optional(),
    status: z.enum(TUserStatus).optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({ id: z.uuid("Invalid user id") }),
  body: z.object({ status: z.enum(TUserStatus) }),
});

export type TListUsersQuery = z.infer<typeof listUsersSchema>["query"];
export type TUpdateUserStatusPayload = z.infer<
  typeof updateUserStatusSchema
>["body"];
