import type { Prisma } from "../../../../generated/prisma/client";
import { TBookingStatus } from "../../../../generated/prisma/enums";
import { prisma } from "../../../lib/prisma";
import { PUBLIC_CATEGORY_SERVICE_WHERE } from "./category.include";
import type {
  IPublicCategoryStats,
  IRankedService,
} from "./category.interface";
import {
  getBookingAggregates,
  getCompletedBookingAggregates,
  getPopularServiceAggregates,
  getResponseAggregates,
  getReviewAggregates,
  getServiceAggregates,
  getServiceTitles,
  getTechnicianPairs,
  getTrendingAggregates,
} from "./category.model";

const TRENDING_MIN_BOOKINGS = 5;
const TRENDING_TOP_SLOTS = 5;
const POPULAR_SERVICE_LIMIT = 4;

export const EMPTY_CATEGORY_STATS: IPublicCategoryStats = {
  technicianCount: 0,
  serviceCount: 0,
  startingPrice: null,
  priceRange: null,
  averageRating: "0.00",
  totalReviews: 0,
  completedJobs: 0,
  totalBookings: 0,
  responseMinutes: null,
  isTrending: false,
  popularServices: [],
  rankedServices: [],
};

export const buildCategoryStats = async (
  categoryIds: string[],
): Promise<Map<string, IPublicCategoryStats>> => {
  const stats = new Map<string, IPublicCategoryStats>();
  if (categoryIds.length === 0) return stats;

  const [
    serviceAggregates,
    technicianPairs,
    reviewAggregates,
    completedBookingAggregates,
    bookingAggregates,
    responseAggregates,
    trendingAggregates,
    popularServiceAggregates,
  ] = await Promise.all([
    getServiceAggregates(categoryIds),
    getTechnicianPairs(categoryIds),
    getReviewAggregates(categoryIds),
    getCompletedBookingAggregates(categoryIds),
    getBookingAggregates(categoryIds),
    getResponseAggregates(categoryIds),
    getTrendingAggregates(categoryIds),
    getPopularServiceAggregates(categoryIds),
  ]);

  const serviceMap = new Map(
    serviceAggregates.map((row) => [row.categoryId, row]),
  );

  const technicianMap = new Map<string, number>();
  for (const item of technicianPairs) {
    const current = technicianMap.get(item.categoryId) ?? 0;
    technicianMap.set(item.categoryId, current + 1);
  }

  const reviewMap = new Map(
    reviewAggregates.map((row) => [row.categoryId, row]),
  );

  const completedBookingMap = new Map(
    completedBookingAggregates.map((row) => [row.categoryId, row._count._all]),
  );

  const bookingMap = new Map(
    bookingAggregates.map((row) => [row.categoryId, row._count._all]),
  );

  const responseMap = new Map(
    responseAggregates.map((row) => [
      row.categoryId,
      row._avg.responseMinutes === null
        ? null
        : Math.round(row._avg.responseMinutes),
    ]),
  );

  const trendingCategoryIds = new Set(
    trendingAggregates
      .filter((item) => item._count._all >= TRENDING_MIN_BOOKINGS)
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, TRENDING_TOP_SLOTS)
      .map((item) => item.categoryId),
  );

  const rankedService = new Map<string, IRankedService[]>();
  for (const row of popularServiceAggregates) {
    const current = rankedService.get(row.categoryId) ?? [];
    current.push({ serviceId: row.serviceId, totalBookings: row._count._all });

    rankedService.set(row.categoryId, current);
  }

  for (const services of rankedService.values()) {
    services.sort((a, b) => b.totalBookings - a.totalBookings);
  }

  // Titles for the Four most booked services in each category. One lookup for the whole batch, keyed by id.
  const popularServiceIds = [...rankedService.values()].flatMap((services) =>
    services.slice(0, POPULAR_SERVICE_LIMIT * 3).map((item) => item.serviceId),
  );

  const popularServices = await getServiceTitles(popularServiceIds);

  const serviceTitleMap = new Map(
    popularServices.map((row) => [row.id, row.title]),
  );

  for (const categoryId of categoryIds) {
    const service = serviceMap.get(categoryId);
    const reviews = reviewMap.get(categoryId);
    const ranked = rankedService.get(categoryId) ?? [];
    const minPrice = service?._min.price ?? null;
    const maxPrice = service?._max.price ?? null;
    stats.set(categoryId, {
      serviceCount: service?._count._all ?? 0,
      startingPrice: minPrice === null ? null : String(minPrice),
      priceRange:
        minPrice === null || maxPrice === null
          ? null
          : { min: String(minPrice), max: String(maxPrice) },
      averageRating: String((reviews?._avg.rating ?? 0).toFixed(2)),
      totalReviews: reviews?._count._all ?? 0,
      technicianCount: technicianMap.get(categoryId) ?? 0,
      completedJobs: completedBookingMap.get(categoryId) ?? 0,
      totalBookings: bookingMap.get(categoryId) ?? 0,
      responseMinutes: responseMap.get(categoryId) ?? null,
      isTrending: trendingCategoryIds.has(categoryId),
      popularServices: [
        ...new Set(
          ranked
            .map((item) => serviceTitleMap.get(item.serviceId))
            .filter((title): title is string => Boolean(title)),
        ),
      ].slice(0, POPULAR_SERVICE_LIMIT),
      rankedServices: ranked,
    });
  }
  return stats;
};
