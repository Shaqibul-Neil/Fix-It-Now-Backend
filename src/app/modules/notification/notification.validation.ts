import z from "zod";

export const listNotificationsSchema = z.object({
  query: z.object({
    isRead: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.uuid("Invalid notification id"),
  }),
});

export type TListNotificationsQuery = z.infer<
  typeof listNotificationsSchema
>["query"];
