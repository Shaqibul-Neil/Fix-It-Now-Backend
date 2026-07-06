import { TRole } from "../../generated/prisma/enums";

export const USER_ROLES = [TRole.ADMIN, TRole.CUSTOMER, TRole.TECHNICIAN];

export type TUserRoles = (typeof USER_ROLES)[number];

export type TPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
