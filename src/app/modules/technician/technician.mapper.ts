import type { Prisma } from "../../../../generated/prisma/client";
import type {
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
  bio: technician.bio,
  experienceYears: technician.experienceYears,
  hourlyRate: technician.hourlyRate,
  serviceRadius: technician.serviceRadius,
  city: technician.city,
  area: technician.area,
  averageRating: technician.averageRating,
  totalReviews: technician.totalReviews,
  approvalStatus: technician.approvalStatus,
  rejectionReason: technician.rejectionReason,
  services: technician.services.map((service) => ({
    id: service.id,
    title: service.title,
    price: service.price,
    category: service.category.name,
  })),
  reviews: technician.reviews,
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
  };
};
