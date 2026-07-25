import type { Prisma } from "../../../../generated/prisma/client";
import { createFullName } from "../../../utils/utils";
import type {
  ADMIN_SERVICE_LIST_INCLUDE,
  SERVICE_PUBLIC_LIST_INCLUDE,
} from "./service.include";

// public list row — flatten category + technician
export const servicePublicListMapper = (
  service: Prisma.ServiceGetPayload<{
    include: typeof SERVICE_PUBLIC_LIST_INCLUDE;
  }>,
) => {
  const { category, technician, ...rest } = service;
  return {
    ...rest,
    category: category.name,
    technicianName: createFullName(
      technician.users.firstName,
      technician.users.lastName,
    ),
    technicianEmail: technician.users.email,
    technicianRating: technician.averageRating,
  };
};

// admin list row — same + totalBookings
export const serviceAdminListMapper = (
  service: Prisma.ServiceGetPayload<{
    include: typeof ADMIN_SERVICE_LIST_INCLUDE;
  }>,
) => {
  const { _count, technician, category, ...rest } = service;
  return {
    ...rest,
    category: category.name,
    technicianName: createFullName(
      technician.users.firstName,
      technician.users.lastName,
    ),
    technicianEmail: technician.users.email,
    technicianRating: technician.averageRating,
    totalBookings: _count.bookings,
  };
};
