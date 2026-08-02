import { type Prisma } from "../../../../generated/prisma/client";
import {
  TDayOfWeek,
  TTechnicianApprovalStatus,
} from "../../../../generated/prisma/enums";
import { PUBLIC_TECHNICIAN_WHERE } from "./technician.include";

import type {
  TAdminListTechniciansQuery,
  TBaseListTechniciansQuery,
  TListTechniciansQuery,
  TPriceBucket,
  TTechnicianSort,
} from "./technician.validation";

// Evening start time.
// Any availability after 6 PM will be considered evening available.
const EVENING_FROM = "18:00";

// Weekend days according to business rule.
const WEEKEND_DAYS = [TDayOfWeek.FRIDAY, TDayOfWeek.SATURDAY];

// Price filter mapping.
const PRICE_BUCKET_RANGES: Record<TPriceBucket, Prisma.DecimalFilter> = {
  under_500: { lt: 500 },
  "500_1000": { gte: 500, lt: 1000 },
  "1000_2000": { gte: 1000, lt: 2000 },
  "2000_plus": { gte: 2000 },
};

// Search and rating — the public and admin lists share these.
const buildBaseTechnicianFilter = (
  query: TBaseListTechniciansQuery,
): Prisma.TechnicianProfileWhereInput => ({
  isProfileComplete: true,

  ...(query.minRating && { averageRating: { gte: query.minRating } }),

  ...(query.search && {
    OR: [
      { city: { contains: query.search, mode: "insensitive" as const } },
      { area: { contains: query.search, mode: "insensitive" as const } },
      {
        users: {
          firstName: { contains: query.search, mode: "insensitive" as const },
        },
      },
      {
        users: {
          lastName: { contains: query.search, mode: "insensitive" as const },
        },
      },
    ],
  }),
});

// Public list — the sidebar.
export const buildTechnicianFilter = (
  query: TListTechniciansQuery,
): Prisma.TechnicianProfileWhereInput => {
  // Get common filters first
  const base = buildBaseTechnicianFilter(query);

  // user must be active
  // user cannot be deleted
  const { users: publicAccountGate, ...publicProfileGate } =
    PUBLIC_TECHNICIAN_WHERE;
  const AND: Prisma.TechnicianProfileWhereInput[] = [];

  // City filter
  // Example:
  // city=[Dhaka,Chittagong]
  //
  if (query.city?.length) {
    AND.push({
      OR: query.city.map((city) => ({
        city: { equals: city, mode: "insensitive" as const },
      })),
    });
  }

  // Price bucket filter
  // hourlyRate >=500
  // hourlyRate <1000
  if (query.priceBuckets?.length) {
    AND.push({
      OR: query.priceBuckets.map((bucket) => ({
        hourlyRate: PRICE_BUCKET_RANGES[bucket],
      })),
    });
  }

  // Evening availability filter
  // Technician must have an active slot
  // ending after 6 PM
  if (query.eveningAvailable) {
    AND.push({
      availabilitySlots: {
        some: { isActive: true, endTime: { gt: EVENING_FROM } },
      },
    });
  }

  // Weekend availability filter
  if (query.weekendAvailable) {
    AND.push({
      availabilitySlots: {
        some: { isActive: true, dayOfWeek: { in: WEEKEND_DAYS } },
      },
    });
  }

  return {
    ...base,
    ...publicProfileGate,
    ...(query.categoryIds?.length && {
      services: {
        some: {
          categoryId: { in: query.categoryIds },
          isActive: true,
          deletedAt: null,
        },
      },
    }),
    ...(query.skills?.length && { skills: { hasSome: query.skills } }),

    ...(query.acceptingClients && { isAvailable: true }),
    ...(query.emergencyService && { offersEmergencyService: true }),

    ...(query.featured !== undefined && { isFeatured: query.featured }),

    ...(AND.length > 0 && { AND }),

    users: publicAccountGate,
  };
};

// Admin list
export const buildAdminTechnicianFilter = (
  query: TAdminListTechniciansQuery,
): Prisma.TechnicianProfileWhereInput => {
  const base = buildBaseTechnicianFilter(query);

  return {
    ...base,
    ...(query.city && {
      city: { equals: query.city, mode: "insensitive" },
    }),
    ...(query.approvalStatus && { approvalStatus: query.approvalStatus }),
    ...(query.featured !== undefined && { isFeatured: query.featured }),
    users: {
      ...(query.accountStatus && { status: query.accountStatus }),
      ...(query.includeDeleted ? {} : { deletedAt: null }),
    },
  };
};

// The "Sort by" dropdown — public list only.
export const buildTechnicianOrderBy = (
  sort: TTechnicianSort = "best_match",
): Prisma.TechnicianProfileOrderByWithRelationInput[] => {
  const tieBreaker = { id: "asc" } as const;

  switch (sort) {
    case "best_match":
      return [
        { isFeatured: "desc" },
        { averageRating: "desc" },
        { totalReviews: "desc" },
        tieBreaker,
      ];
    case "top_rated":
      return [{ averageRating: "desc" }, { totalReviews: "desc" }, tieBreaker];
    case "most_reviewed":
      return [{ totalReviews: "desc" }, { averageRating: "desc" }, tieBreaker];
    case "price_low":
      return [{ hourlyRate: "asc" }, tieBreaker];
    case "price_high":
      return [{ hourlyRate: "desc" }, tieBreaker];
    case "newest":
      return [{ createdAt: "desc" }, tieBreaker];
  }
};

// The admin table
export const buildAdminTechnicianOrderBy = (
  approvalStatus?: TTechnicianApprovalStatus,
): Prisma.TechnicianProfileOrderByWithRelationInput[] =>
  approvalStatus === TTechnicianApprovalStatus.PENDING
    ? [{ createdAt: "asc" }, { id: "asc" }]
    : [{ createdAt: "desc" }, { id: "asc" }];

// Counts for the checkbox labels
export const tallyValues = (lists: string[][]) => {
  const counts = new Map<string, number>();

  for (const list of lists) {
    for (const value of list) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
};
