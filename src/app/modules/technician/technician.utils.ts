import { type Prisma } from "../../../../generated/prisma/client";
import {
  TTechnicianApprovalStatus,
  TUserStatus,
} from "../../../../generated/prisma/enums";

import type {
  TAdminListTechniciansQuery,
  TListTechniciansQuery,
} from "./technician.validation";

// city / rating / name search — the public and admin lists share these.
const buildSharedTechnicianFilter = (
  query: TListTechniciansQuery,
): Prisma.TechnicianProfileWhereInput => ({
  isProfileComplete: true,

  ...(query.city && {
    city: {
      equals: query.city,
      mode: "insensitive",
    },
  }),

  ...(query.minRating && {
    averageRating: {
      gte: query.minRating,
    },
  }),

  ...(query.search && {
    users: {
      OR: [
        {
          firstName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      ],
    },
  }),
});

// Public list — customers only ever see technicians an admin has approved.
export const buildTechnicianFilter = (
  query: TListTechniciansQuery,
): Prisma.TechnicianProfileWhereInput => {
  const shared = buildSharedTechnicianFilter(query);

  return {
    ...shared,
    approvalStatus: TTechnicianApprovalStatus.APPROVED,
    users: {
      ...(shared.users as Prisma.UserWhereInput | undefined),
      status: TUserStatus.ACTIVE,
    },
  };
};

// Admin list — the approval tab decides which bucket comes back.
// No tab selected means the admin wants every technician.
export const buildAdminTechnicianFilter = (
  query: TAdminListTechniciansQuery,
): Prisma.TechnicianProfileWhereInput => ({
  ...buildSharedTechnicianFilter(query),
  ...(query.approvalStatus && { approvalStatus: query.approvalStatus }),
});
