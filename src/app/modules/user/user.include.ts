import type { Prisma } from "../../../../generated/prisma/client";

export const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
} as const satisfies Prisma.UserSelect;

// user status check before ban / reactivate
export const USER_STATUS_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  deletedAt: true,
} as const satisfies Prisma.UserSelect;

// admin table: user row + total bookings placed (only customers have a profile)
export const ADMIN_USER_LIST_SELECT = {
  ...USER_SELECT,
  deletedAt: true,
  customerProfile: {
    select: { avatar: true, _count: { select: { bookings: true } } },
  },
  technicianProfile: {
    select: { avatar: true },
  },
} as const satisfies Prisma.UserSelect;
