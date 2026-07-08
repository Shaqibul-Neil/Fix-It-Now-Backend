import type { Prisma } from "../../../../generated/prisma/client";
import { CUSTOMER_PROFILE_SELECT } from "./customer.include";

export const customerProfileMapper = (
  profile: Prisma.CustomerProfileGetPayload<{
    select: typeof CUSTOMER_PROFILE_SELECT;
  }>,
) => ({
  id: profile.id,
  phone: profile.phone,
  avatar: profile.avatar,
  defaultAddress: profile.defaultAddress,
  city: profile.city,
  area: profile.area,
  postalCode: profile.postalCode,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
  firstName: profile.users.firstName,
  lastName: profile.users.lastName,
  email: profile.users.email,
  lastLoginAt: profile.users.lastLoginAt,
});
