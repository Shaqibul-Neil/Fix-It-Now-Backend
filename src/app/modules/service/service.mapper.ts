import type { Prisma } from "../../../../generated/prisma/client";
import { createFullName } from "../../../utils/utils";
import type {
  ADMIN_SERVICE_LIST_INCLUDE,
  SERVICE_MY_LIST_INCLUDE,
  SERVICE_PUBLIC_LIST_INCLUDE,
} from "./service.include";

const toRemovedBy = (
  remover: { firstName: string; lastName: string; role: string } | null,
) =>
  remover
    ? {
        name: createFullName(remover.firstName, remover.lastName),
        role: remover.role,
      }
    : null;

// public list row — flatten category + technician
export const servicePublicListMapper = (
  service: Prisma.ServiceGetPayload<{
    include: typeof SERVICE_PUBLIC_LIST_INCLUDE;
  }>,
) => {
  const { category, technician, deletedAt, deletedBy, ...rest } = service;

  return {
    ...rest,
    category: category.name,
    // A service carries no image of its own, so the card borrows its category's.
    categoryImage: category.image,
    technicianName: createFullName(
      technician.users.firstName,
      technician.users.lastName,
    ),
    technicianEmail: technician.users.email,
    technicianRating: technician.averageRating,
    technicianAvatar: technician.avatar,
  };
};

// technician list row
export const serviceTechnicianListMapper = (
  service: Prisma.ServiceGetPayload<{
    include: typeof SERVICE_MY_LIST_INCLUDE;
  }>,
) => {
  const { category, deletedBy, deletedByUser, ...rest } = service;

  return {
    ...rest,
    category: category.name,
    categoryImage: category.image,
    isDeleted: Boolean(service.deletedAt),
    removedBy: toRemovedBy(deletedByUser),
  };
};

// admin list row — same + totalBookings, minus the long description
//
// `description` is dropped on purpose. It is up to 2000 characters and the admin
// table has one line per service, so every row would ship a paragraph nothing
// renders — a hundred rows of dead weight in the response. It is still on
// `GET /services/{id}`, which is where the admin goes to actually read it.
export const serviceAdminListMapper = (
  service: Prisma.ServiceGetPayload<{
    include: typeof ADMIN_SERVICE_LIST_INCLUDE;
  }>,
) => {
  const {
    _count,
    technician,
    category,
    description,
    deletedBy,
    deletedByUser,
    ...rest
  } = service;
  return {
    ...rest,
    category: category.name,
    categoryImage: category.image,
    technicianName: createFullName(
      technician.users.firstName,
      technician.users.lastName,
    ),
    technicianEmail: technician.users.email,
    technicianRating: technician.averageRating,
    technicianAvatar: technician.avatar,
    totalBookings: _count.bookings,
    isDeleted: Boolean(service.deletedAt),
    removedBy: toRemovedBy(deletedByUser),
  };
};
