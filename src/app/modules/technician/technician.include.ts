import type { Prisma } from "../../../../generated/prisma/client";
import { TReviewStatus } from "../../../../generated/prisma/enums";

export const TECHNICIAN_LIST_SELECT = {
  id: true,
  experienceYears: true,
  hourlyRate: true,
  city: true,
  area: true,
  averageRating: true,
  totalReviews: true,
  users: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} as const satisfies Prisma.TechnicianProfileSelect;

export const TECHNICIAN_DETAILS_SELECT = {
  id: true,
  bio: true,
  experienceYears: true,
  hourlyRate: true,
  serviceRadius: true,
  city: true,
  area: true,
  averageRating: true,
  totalReviews: true,
  users: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
  services: {
    where: {
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      price: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  },
  reviews: {
    where: {
      status: TReviewStatus.PUBLISHED,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  },
} as const satisfies Prisma.TechnicianProfileSelect;

// profile + owner name — for create/update responses
export const TECHNICIAN_PROFILE_WITH_USER_INCLUDE = {
  users: {
    select: {
      firstName: true,
      lastName: true,
    },
  },
} as const satisfies Prisma.TechnicianProfileInclude;

// technician's own profile view
export const TECHNICIAN_MY_PROFILE_INCLUDE = {
  users: {
    select: {
      firstName: true,
      lastName: true,
      lastLoginAt: true,
      email: true,
    },
  },
} as const satisfies Prisma.TechnicianProfileInclude;
