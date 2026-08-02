import {
  TTechnicianApprovalStatus,
  type Prisma,
} from "../../../../generated/prisma/client";
import { toParagraphs } from "../../../utils/utils";
import { publicReviewMapper } from "../review/review.mapper";
import type {
  ADMIN_TECHNICIAN_DETAILS_SELECT,
  ADMIN_TECHNICIAN_LIST_SELECT,
  TECHNICIAN_DETAILS_SELECT,
  TECHNICIAN_LIST_SELECT,
  TECHNICIAN_ROW_SELECT,
} from "./technician.include";

// list row — flatten owner name
export const technicianRowMapper = (
  technician: Prisma.TechnicianProfileGetPayload<{
    select: typeof TECHNICIAN_ROW_SELECT;
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

export const technicianListMapper = (
  technician: Prisma.TechnicianProfileGetPayload<{
    select: typeof TECHNICIAN_LIST_SELECT;
  }>,
) => ({
  ...technicianRowMapper(technician),
  bio: technician.bio,
  isFeatured: technician.isFeatured,
  professionalTitle: technician.professionalTitle,
  skills: technician.skills,
  isAvailable: technician.isAvailable,
  offersEmergencyService: technician.offersEmergencyService,
  services: technician.services.map((service) => ({
    id: service.id,
    title: service.title,
    price: service.price,
    category: service.category.name,
  })),
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
  coverImage: technician.coverImage,
  professionalTitle: technician.professionalTitle,
  tagline: technician.tagline,
  isVerified: technician.approvalStatus === TTechnicianApprovalStatus.APPROVED,
  bio: toParagraphs(technician.bio),
  experienceYears: technician.experienceYears,
  hourlyRate: technician.hourlyRate,
  serviceRadius: technician.serviceRadius,
  city: technician.city,
  area: technician.area,
  averageRating: technician.averageRating,
  totalReviews: technician.totalReviews,
  isAvailable: technician.isAvailable,
  isFeatured: technician.isFeatured,
  offersEmergencyService: technician.offersEmergencyService,
  skills: technician.skills,
  workHighlights: technician.workHighlights,
  services: technician.services.map((service) => ({
    id: service.id,
    title: service.title,
    price: service.price,
    estimatedDuration: service.estimatedDuration,
    category: service.category.name,
    categoryImage: service.category.image,
  })),
  reviews: technician.reviews.map(publicReviewMapper),
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
    ...technicianRowMapper(rest),
    phone: technician.phone,
    isFeatured: technician.isFeatured,
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
  address: technician.address,
  avatar: technician.avatar,
  coverImage: technician.coverImage,
  professionalTitle: technician.professionalTitle,
  tagline: technician.tagline,
  bio: toParagraphs(technician.bio),
  experienceYears: technician.experienceYears,
  hourlyRate: technician.hourlyRate,
  serviceRadius: technician.serviceRadius,
  city: technician.city,
  area: technician.area,
  averageRating: technician.averageRating,
  totalReviews: technician.totalReviews,
  isAvailable: technician.isAvailable,
  isFeatured: technician.isFeatured,
  isProfileComplete: technician.isProfileComplete,
  offersEmergencyService: technician.offersEmergencyService,
  skills: technician.skills,
  workHighlights: technician.workHighlights,
  // What the admin checks before approving, and who to call if a job goes
  // wrong. Grouped so it is obvious this block has no business in a public
  // select — the public details endpoint has its own narrower one.
  identity: {
    nationalId: technician.nationalId,
    nidDocument: technician.nidDocument,
    passportNumber: technician.passportNumber,
    dateOfBirth: technician.dateOfBirth,
    emergencyContactName: technician.emergencyContactName,
    emergencyContactPhone: technician.emergencyContactPhone,
  },
  approvalStatus: technician.approvalStatus,
  rejectionReason: technician.rejectionReason,
  reviewedAt: technician.reviewedAt,
  reviewedBy: technician.reviewedBy,
  appliedAt: technician.createdAt,
  updatedAt: technician.updatedAt,
  accountStatus: technician.users.status,
  isDeleted: Boolean(technician.users.deletedAt),
  services: technician.services.map((service) => ({
    id: service.id,
    title: service.title,
    price: service.price,
    estimatedDuration: service.estimatedDuration,
    category: service.category.name,
    categoryImage: service.category.image,
    isActive: service.isActive,
    isDeleted: Boolean(service.deletedAt),
  })),
  reviews: technician.reviews.map(publicReviewMapper),
  availability: technician.availabilitySlots,
});
