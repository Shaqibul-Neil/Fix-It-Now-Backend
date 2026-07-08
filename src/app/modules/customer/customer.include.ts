import type { Prisma } from "../../../../generated/prisma/client";

export const CUSTOMER_PROFILE_SELECT = {
  id: true,
  phone: true,
  avatar: true,
  defaultAddress: true,
  city: true,
  area: true,
  postalCode: true,
  createdAt: true,
  updatedAt: true,
  users: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
      lastLoginAt: true,
    },
  },
} as const satisfies Prisma.CustomerProfileSelect;
