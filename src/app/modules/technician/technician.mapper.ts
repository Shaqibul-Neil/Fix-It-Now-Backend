import type { Prisma } from "../../../../generated/prisma/client";
import { toParagraphs } from "../../../utils/utils";
import { publicReviewMapper } from "../review/review.mapper";
import type {
  ADMIN_TECHNICIAN_DETAILS_SELECT,
  ADMIN_TECHNICIAN_LIST_SELECT,
  TECHNICIAN_DETAILS_SELECT,
  TECHNICIAN_LIST_SELECT,
} from "./technician.include";

// list row — flatten owner name
export const technicianListMapper = (
  technician: Prisma.TechnicianProfileGetPayload<{
    select: typeof TECHNICIAN_LIST_SELECT;
  }>,
) => ({
  id: technician.id,
  firstName: technician.users.firstName,
  lastName: technician.users.lastName,
  email: technician.users.email,
  avatar: technician.avatar,
  experienceYears: technician.experienceYears,
  hourlyRate: technician.hourlyRate,
  city: technician.city,
  area: technician.area,
  averageRating: technician.averageRating,
  totalReviews: technician.totalReviews,
});

// details — flatten owner name + flatten each service's category
export const technicianDetailsMapper = (
  technician: Prisma.TechnicianProfileGetPayload<{
    select: typeof TECHNICIAN_DETAILS_SELECT;
  }>,
) => ({
  id: technician.id,
  firstName: technician.users.firstName,
  lastName: technician.users.lastName,
  email: technician.users.email,
  avatar: technician.avatar,
  bio: toParagraphs(technician.bio),
  experienceYears: technician.experienceYears,
  hourlyRate: technician.hourlyRate,
  serviceRadius: technician.serviceRadius,
  city: technician.city,
  area: technician.area,
  averageRating: technician.averageRating,
  totalReviews: technician.totalReviews,
  services: technician.services.map((service) => ({
    id: service.id,
    title: service.title,
    price: service.price,
    category: service.category.name,
  })),
  reviews: technician.reviews.map(publicReviewMapper),
  // Renamed off the relation: the page shows "when they work", and nothing on
  // the client cares that a row of the slot table is behind it.
  availability: technician.availabilitySlots,
});

// admin table row — approval state + contact + completed jobs on top of the list row
export const technicianAdminListMapper = (
  technician: Prisma.TechnicianProfileGetPayload<{
    select: typeof ADMIN_TECHNICIAN_LIST_SELECT;
  }>,
) => {
  const { _count, ...rest } = technician;

  return {
    ...technicianListMapper(rest),
    phone: technician.phone,
    approvalStatus: technician.approvalStatus,
    rejectionReason: technician.rejectionReason,
    reviewedAt: technician.reviewedAt,
    appliedAt: technician.createdAt,
    completedJobs: _count.bookings,
    accountStatus: technician.users.status,
    userId: technician.users.id,
    isDeleted: Boolean(technician.users.deletedAt),
  };
};

// admin detail — the public shape plus moderation state and the full service
// list, removed rows included
export const technicianAdminDetailsMapper = (
  technician: Prisma.TechnicianProfileGetPayload<{
    select: typeof ADMIN_TECHNICIAN_DETAILS_SELECT;
  }>,
) => ({
  id: technician.id,
  userId: technician.users.id,
  firstName: technician.users.firstName,
  lastName: technician.users.lastName,
  email: technician.users.email,
  phone: technician.phone,
  avatar: technician.avatar,
  bio: toParagraphs(technician.bio),
  experienceYears: technician.experienceYears,
  hourlyRate: technician.hourlyRate,
  serviceRadius: technician.serviceRadius,
  city: technician.city,
  area: technician.area,
  averageRating: technician.averageRating,
  totalReviews: technician.totalReviews,
  approvalStatus: technician.approvalStatus,
  rejectionReason: technician.rejectionReason,
  reviewedAt: technician.reviewedAt,
  appliedAt: technician.createdAt,
  accountStatus: technician.users.status,
  isDeleted: Boolean(technician.users.deletedAt),
  services: technician.services.map((service) => ({
    id: service.id,
    title: service.title,
    price: service.price,
    category: service.category.name,
    isActive: service.isActive,
    isDeleted: Boolean(service.deletedAt),
  })),
  reviews: technician.reviews.map(publicReviewMapper),
  availability: technician.availabilitySlots,
});
