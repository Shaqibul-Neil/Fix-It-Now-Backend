import type { Prisma } from "../../../../generated/prisma/client";

// category existence + active check (create/update service)
export const SERVICE_CATEGORY_CHECK_SELECT = {
  id: true,
  isActive: true,
} as const satisfies Prisma.CategorySelect;

// ownership check (update)
export const SERVICE_OWNERSHIP_SELECT = {
  id: true,
  technicianId: true,
} as const satisfies Prisma.ServiceSelect;

// service loaded before delete (owner + title for notify)
export const SERVICE_DELETE_SELECT = {
  id: true,
  title: true,
  technicianId: true,
  technician: {
    select: {
      userId: true,
      users: { select: { firstName: true, lastName: true } },
    },
  },
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

// technician's own service list
export const SERVICE_MY_LIST_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const satisfies Prisma.ServiceInclude;

// public service list (+ technician summary)
export const SERVICE_PUBLIC_LIST_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  technician: {
    select: {
      id: true,
      city: true,
      area: true,
      averageRating: true,
      hourlyRate: true,
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
