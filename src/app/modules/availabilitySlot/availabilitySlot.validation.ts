import { z } from "zod";
import { TDayOfWeek } from "../../../../generated/prisma/enums";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const slotSchema = z
  .object({
    dayOfWeek: z.enum(TDayOfWeek),
    startTime: z.string().regex(timeRegex, "startTime must be HH:mm (24h)"),
    endTime: z.string().regex(timeRegex, "endTime must be HH:mm (24h)"),
    // A day kept in the schedule but not taking work — a holiday, not a
    // deletion. Defaults to live, so a client that never sends it is unaffected.
    isActive: z.boolean().default(true),
  })
  .refine((s) => s.startTime < s.endTime, {
    message: "EndTime must be after startTime",
    path: ["endTime"],
  });

export const setAvailabilitySchema = z.object({
  body: z.object({
    slots: z
      .array(slotSchema)
      .min(1, "Provide at least one slot")
      .max(50, "Too many slots"),
  }),
});

export type TSetAvailabilityPayload = z.infer<
  typeof setAvailabilitySchema
>["body"];
