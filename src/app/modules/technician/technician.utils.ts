import type { Prisma } from "../../../../generated/prisma/client";
import type { TListTechniciansQuery } from "./technician.validation";

export const buildTechnicianFilter = (
  query: TListTechniciansQuery,
): Prisma.TechnicianProfileWhereInput => ({
  isProfileComplete: true,

  ...(query.city && {
    city: {
      equals: query.city,
      mode: "insensitive",
    },
  }),

  ...(query.minRating && {
    averageRating: {
      gte: query.minRating,
    },
  }),

  ...(query.search && {
    users: {
      OR: [
        {
          firstName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      ],
    },
  }),
});
