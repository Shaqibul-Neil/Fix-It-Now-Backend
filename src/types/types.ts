import { TRole } from "../../generated/prisma/enums";

export const USER_ROLES = [
  TRole.ADMIN,
  TRole.CUSTOMER,
  TRole.TECHNICIAN,
] as const;

export type TUserRoles = (typeof USER_ROLES)[number];

export type TPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export const PERIODS = ["1", "7", "30", "90", "365"] as const;
export type TPeriod = (typeof PERIODS)[number];
