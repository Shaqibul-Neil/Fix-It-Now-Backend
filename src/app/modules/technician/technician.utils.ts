import httpStatus from "http-status";
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/appError";
import type { Prisma } from "../../../../generated/prisma/client";
import type { TListTechniciansQuery } from "./technician.validation";

export const findTechnicianProfileByUserId = async (userId: string) => {
  const profile = await prisma.technicianProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) {
    throw new AppError(
      "Profile not found. Please complete your onboarding first.",
      httpStatus.NOT_FOUND,
    );
  }
  return profile;
};

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
