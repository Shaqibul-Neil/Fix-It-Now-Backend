import type { Prisma } from "../../../../generated/prisma/client";

// category existence + active check (create/update service)
export const SERVICE_CATEGORY_CHECK_SELECT = {
  id: true,
  isActive: true,
  deletedAt: true,
} as const satisfies Prisma.CategorySelect;

// The row every write loads first — enough to answer "does it exist, who owns it, and has it already been removed". Update, delete and restore all need exactly this, so they share one select.
export const SERVICE_WRITE_SELECT = {
  id: true,
  title: true,
  technicianId: true,
  categoryId: true,
  isActive: true,
  deletedAt: true,
  deletedBy: true,
} as const satisfies Prisma.ServiceSelect;

// service returned after create (+ owner name for notify)
export const SERVICE_CREATED_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  technician: {
    select: {
      users: {
        select: { firstName: true, lastName: true },
      },
    },
  },
} as const satisfies Prisma.ServiceInclude;

// service returned after update (+ owner name for notify)
export const SERVICE_UPDATED_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  technician: {
    select: {
      users: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  },
} as const satisfies Prisma.ServiceInclude;

export const SERVICE_DELETED_INCLUDE = {
  technician: {
    select: {
      userId: true,
      users: { select: { firstName: true, lastName: true } },
    },
  },
} as const satisfies Prisma.ServiceInclude;

// Who removed the row
const SERVICE_REMOVED_BY_SELECT = {
  select: { id: true, firstName: true, lastName: true, role: true },
} as const satisfies Prisma.ServiceInclude["deletedByUser"];

// technician's own service list
export const SERVICE_MY_LIST_INCLUDE = {
  category: {
    select: {
      name: true,
      image: true,
    },
  },
  deletedByUser: SERVICE_REMOVED_BY_SELECT,
} as const satisfies Prisma.ServiceInclude;

// public service list (+ technician summary)
export const SERVICE_PUBLIC_LIST_INCLUDE = {
  category: {
    select: {
      name: true,
      image: true,
    },
  },
  technician: {
    select: {
      averageRating: true,
      avatar: true,
      users: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  },
} as const satisfies Prisma.ServiceInclude;

// admin table: public card + total booking count
export const ADMIN_SERVICE_LIST_INCLUDE = {
  ...SERVICE_PUBLIC_LIST_INCLUDE,
  _count: { select: { bookings: true } },
  deletedByUser: SERVICE_REMOVED_BY_SELECT,
} as const satisfies Prisma.ServiceInclude;

// admin detail
export const SERVICE_DETAILS_INCLUDE = {
  category: { select: { id: true, name: true } },
  technician: {
    select: {
      id: true,
      city: true,
      area: true,
      averageRating: true,
      users: { select: { firstName: true, lastName: true } },
    },
  },
} as const satisfies Prisma.ServiceInclude;
