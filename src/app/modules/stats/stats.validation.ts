import z from "zod";
import { PERIODS } from "../../../types/types";

export const statsPeriodSchema = z.object({
  query: z
    .object({
      period: z.enum(PERIODS).transform(Number).optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .refine((q) => !((q.from || q.to) && q.period !== undefined), {
      message: "Use either `period` or `from`/`to`, not both",
      path: ["period"],
    })
    .refine((q) => !q.from || !q.to || q.from <= q.to, {
      message: "`from` must be before or equal to `to`",
      path: ["from"],
    }),
});

export type TStatsPeriodQuery = z.infer<typeof statsPeriodSchema>["query"];
