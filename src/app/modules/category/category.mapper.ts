import type { Prisma } from "../../../../generated/prisma/client";
import { createFullName, toParagraphs } from "../../../utils/utils";
import type {
  ADMIN_CATEGORY_SELECT,
  PUBLIC_CATEGORY_DETAILS_SELECT,
  PUBLIC_CATEGORY_SELECT,
} from "./category.include";
import type {
  IPublicCategoryStats,
  TCategoryServiceRow,
  TCategoryTechnicianRow,
} from "./category.interface";

export const categoryAdminMapper = (
  category: Prisma.CategoryGetPayload<{
    select: typeof ADMIN_CATEGORY_SELECT;
  }>,
) => {
  const { _count, ...rest } = category;

  return {
    ...rest,
    totalServices: _count.services,
    isDeleted: Boolean(category.deletedAt),
  };
};

// Home grid + listing page card.
export const categoryCardMapper = (
  category: Prisma.CategoryGetPayload<{
    select: typeof PUBLIC_CATEGORY_SELECT;
  }>,
  stats: IPublicCategoryStats,
) => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  description: category.description,
  image: category.image,
  technicianCount: stats.technicianCount,
  serviceCount: stats.serviceCount,
  startingPrice: stats.startingPrice,
  averageRating: stats.averageRating,
  totalReviews: stats.totalReviews,
  popularServices: stats.popularServices,
  isTrending: stats.isTrending,
});

export const categoryTopTechnicianMapper = (
  technician: TCategoryTechnicianRow,
  completedJobs: number,
) => ({
  id: technician.id,
  name: createFullName(technician.users.firstName, technician.users.lastName),
  avatar: technician.avatar,
  professionalTitle: technician.professionalTitle,
  city: technician.city,
  area: technician.area,
  averageRating: technician.averageRating,
  totalReviews: technician.totalReviews,
  completedJobs,
  hourlyRate: technician.hourlyRate,
  isFeatured: technician.isFeatured,
  isAvailable: technician.isAvailable,
});

export const categoryTopServiceMapper = (
  service: TCategoryServiceRow,
  totalBookings: number,
) => ({
  id: service.id,
  title: service.title,
  technicianId: service.technicianId,
  technicianName: createFullName(
    service.technician.users.firstName,
    service.technician.users.lastName,
  ),
  price: service.price,
  estimatedDuration: service.estimatedDuration,
  totalBookings,
});

export const categoryDetailsMapper = ({
  category,
  stats,
  topTechnicians,
  topServices,
}: {
  category: Prisma.CategoryGetPayload<{
    select: typeof PUBLIC_CATEGORY_DETAILS_SELECT;
  }>;
  stats: IPublicCategoryStats;
  topTechnicians: ReturnType<typeof categoryTopTechnicianMapper>[];
  topServices: ReturnType<typeof categoryTopServiceMapper>[];
}) => ({
  ...categoryCardMapper(category, stats),
  coverImage: category.coverImage,
  tagline: category.tagline,
  overview: toParagraphs(category.overview),
  completedJobs: stats.completedJobs,
  responseMinutes: stats.responseMinutes,
  priceRange: stats.priceRange,
  commonIssues: category.commonIssues,

  topTechnicians,
  topServices,
});
