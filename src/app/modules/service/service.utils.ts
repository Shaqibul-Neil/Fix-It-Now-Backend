import type { Prisma } from "../../../../generated/prisma/client";
import { generateSlug } from "../../../utils/utils";
import { PUBLIC_TECHNICIAN_WHERE } from "../technician/technician.include";
import type { TListServicesQuery } from "./service.validation";

// ---------- Public Service Filter ----------
export const buildServiceFilter = (
  query: TListServicesQuery,
): Prisma.ServiceWhereInput => {
  return {
    isActive: true,

    technician: {
      ...(query.city && {
        city: {
          contains: query.city,
          mode: "insensitive",
        },
      }),

      ...(query.area && {
        area: {
          contains: query.area,
          mode: "insensitive",
        },
      }),

      ...(query.minRating !== undefined && {
        averageRating: {
          gte: query.minRating,
        },
      }),

      // Spread last: a filter the caller sends can narrow this list, never
      // widen it past the visibility gate.
      ...PUBLIC_TECHNICIAN_WHERE,
    },

    ...(query.category && {
      category: {
        slug: generateSlug(query.category),
      },
    }),

    ...(query.search && {
      title: {
        contains: query.search,
        mode: "insensitive",
      },
    }),
  };
};

// ---------- Technician's Own Services Filter ----------
export const buildMyServiceFilter = (
  technicianId: string,
  query: TListServicesQuery,
): Prisma.ServiceWhereInput => {
  return {
    technicianId,

    ...(query.category && {
      category: {
        slug: generateSlug(query.category),
      },
    }),

    ...(query.search && {
      title: {
        contains: query.search,
        mode: "insensitive",
      },
    }),
  };
};

// ---------- Admin Service Filter ----------
export const buildAdminServiceFilter = (
  query: TListServicesQuery,
): Prisma.ServiceWhereInput => ({
  ...(query.category && {
    category: {
      slug: generateSlug(query.category),
    },
  }),

  ...(query.search && {
    title: {
      contains: query.search,
      mode: "insensitive",
    },
  }),

  technician: {
    ...(query.city && {
      city: {
        contains: query.city,
        mode: "insensitive",
      },
    }),

    ...(query.area && {
      area: {
        contains: query.area,
        mode: "insensitive",
      },
    }),

    ...(query.minRating !== undefined && {
      averageRating: {
        gte: query.minRating,
      },
    }),
  },
});
