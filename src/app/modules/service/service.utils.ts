import {
  Prisma,
  TTechnicianApprovalStatus,
  TUserStatus,
} from "../../../../generated/prisma/client";
import { generateSlug } from "../../../utils/utils";
import type { TListServicesQuery } from "./service.validation";

// ---------- Public Service Filter ----------
export const buildServiceFilter = (
  query: TListServicesQuery,
): Prisma.ServiceWhereInput => {
  return {
    isActive: true,

    technician: {
      isProfileComplete: true,
      approvalStatus: TTechnicianApprovalStatus.APPROVED,
      users: { status: TUserStatus.ACTIVE },
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
