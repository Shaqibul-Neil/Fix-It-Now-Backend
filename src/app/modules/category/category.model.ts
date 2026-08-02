import type { Prisma } from "../../../../generated/prisma/client";
import {
  TBookingStatus,
  TReviewStatus,
} from "../../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";
import { LIVE_ONLY } from "../../../utils/recordStatus";
import { getDateFromPeriod } from "../../../utils/utils";
import { buildTechnicianOrderBy } from "../technician/technician.utils";
import {
  CATEGORY_SERVICE_SELECT,
  CATEGORY_TECHNICIAN_SELECT,
  PUBLIC_CATEGORY_DETAILS_SELECT,
  PUBLIC_CATEGORY_SELECT,
  PUBLIC_CATEGORY_SERVICE_WHERE,
} from "./category.include";
import {
  buildCategoryServiceFilter,
  buildCategoryTechnicianFilter,
} from "./category.utils";

export const TRENDING_WINDOW_DAYS = 30;
const EXCLUDED_BOOKING_STATUSES = [
  TBookingStatus.DECLINED,
  TBookingStatus.CANCELLED,
];

// ---------- the category rows themselves ----------
export const findLiveCategories = () => {
  return prisma.category.findMany({
    where: LIVE_ONLY,
    orderBy: { name: "asc" },
    select: PUBLIC_CATEGORY_SELECT,
  });
};

export const findLiveCategoryBySlug = (slug: string) => {
  return prisma.category.findFirst({
    where: { slug, ...LIVE_ONLY },
    select: PUBLIC_CATEGORY_DETAILS_SELECT,
  });
};

// ---------- aggregates, one grouped query per metric ----------
// serviceCount + startingPrice + priceRange
export const getServiceAggregates = (categoryIds: string[]) => {
  return prisma.service.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: {
        in: categoryIds,
      },
      ...PUBLIC_CATEGORY_SERVICE_WHERE,
    },
    _count: { _all: true },
    _min: { price: true },
    _max: { price: true },
  });
};

// One plumber with four services in Plumbing is one plumber. Counting off the service rows would call them four, so the distinct pairs get counted instead of the rows.
export const getTechnicianPairs = (categoryIds: string[]) => {
  return prisma.service.findMany({
    where: {
      categoryId: {
        in: categoryIds,
      },
      ...PUBLIC_CATEGORY_SERVICE_WHERE,
    },
    select: { categoryId: true, technicianId: true },
    distinct: ["categoryId", "technicianId"],
  });
};

// averageRating + totalReviews. Only published reviews — a pending one is
// not something a customer is allowed to see yet.
export const getReviewAggregates = (categoryIds: string[]) => {
  return prisma.review.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: { in: categoryIds },
      status: TReviewStatus.PUBLISHED,
    },
    _count: { _all: true },
    _avg: { rating: true },
  });
};

// completedJobs
export const getCompletedBookingAggregates = (categoryIds: string[]) => {
  return prisma.booking.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: {
        in: categoryIds,
      },
      status: TBookingStatus.COMPLETED,
    },
    _count: {
      _all: true,
    },
  });
};

// totalBookings — everything that stuck, whatever stage it is at now.
export const getBookingAggregates = (categoryIds: string[]) => {
  return prisma.booking.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: {
        in: categoryIds,
      },
      status: {
        notIn: EXCLUDED_BOOKING_STATUSES,
      },
    },
    _count: {
      _all: true,
    },
  });
};

// responseMinutes. Averaged over everything that was ever accepted, not only what finished — a job accepted in 10 minutes and cancelled next day still says how fast the category answers.
export const getResponseAggregates = (categoryIds: string[]) => {
  return prisma.booking.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: {
        in: categoryIds,
      },
      responseMinutes: {
        not: null,
      },
    },
    _avg: {
      responseMinutes: true,
    },
  });
};

// isTrending
export const getTrendingAggregates = (categoryIds: string[]) => {
  return prisma.booking.groupBy({
    by: ["categoryId"],
    where: {
      categoryId: {
        in: categoryIds,
      },
      createdAt: { gte: getDateFromPeriod(TRENDING_WINDOW_DAYS) },
      status: {
        notIn: EXCLUDED_BOOKING_STATUSES,
      },
    },
    _count: { _all: true },
  });
};

// popularServices + totalBookings, grouped on both columns so one pass covers every category in the batch.
export const getPopularServiceAggregates = (categoryIds: string[]) => {
  return prisma.booking.groupBy({
    by: ["categoryId", "serviceId"],
    where: {
      categoryId: {
        in: categoryIds,
      },
      status: {
        notIn: EXCLUDED_BOOKING_STATUSES,
      },
    },
    _count: {
      _all: true,
    },
  });
};

// Titles for the ids the ranking picked out. One lookup for the whole batch.
export const getServiceTitles = (serviceIds: string[]) => {
  return prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, title: true },
  });
};

// ---------- details-page strips ----------
export const findCategoryTechnicians = (categoryId: string, take: number) => {
  return prisma.technicianProfile.findMany({
    where: buildCategoryTechnicianFilter(categoryId),
    take,
    orderBy: buildTechnicianOrderBy("top_rated"),
    select: CATEGORY_TECHNICIAN_SELECT,
  });
};

// Jobs each shown technician finished in THIS category. Scoped on purpose: on
// the plumbing page "512 jobs" has to mean 512 plumbing jobs, not 512 jobs
// across every trade they list under.
export const getCompletedJobsByTechnician = (
  categoryId: string,
  technicianIds: string[],
) => {
  return prisma.booking.groupBy({
    by: ["technicianId"],
    where: {
      categoryId,
      technicianId: { in: technicianIds },
      status: TBookingStatus.COMPLETED,
    },
    _count: { _all: true },
  });
};

// Re-filtered, not trusted: a service booked fifty times last year but paused
// since must not come back onto the page just because it ranks high.
export const findCategoryServicesByIds = (
  categoryId: string,
  serviceIds: string[],
) => {
  return prisma.service.findMany({
    where: {
      ...buildCategoryServiceFilter(categoryId),
      id: { in: serviceIds },
    },
    select: CATEGORY_SERVICE_SELECT,
  });
};

// A category with no booking history still has to show something, so the rest
// of the strip is filled with the cheapest live services.
export const findCheapestCategoryServices = (
  categoryId: string,
  excludeServiceIds: string[],
  take: number,
) => {
  return prisma.service.findMany({
    where: {
      ...buildCategoryServiceFilter(categoryId),
      id: { notIn: excludeServiceIds },
    },
    take,
    orderBy: [{ price: "asc" }, { id: "asc" }],
    select: CATEGORY_SERVICE_SELECT,
  });
};
