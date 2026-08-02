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

export const PERIODS = ["7", "30", "90", "365"] as const;

export type TPeriod = (typeof PERIODS)[number];
export type TRange = { gte: Date; lte: Date };
export type TInterval = "day" | "week" | "month";

/**
 * Which shelf of a soft-deletable table to read. `isActive` and `deletedAt` are
 * two independent columns, and these four values are the only combinations a
 * list screen ever asks for.
 *
 * active  — switched on and not deleted
 * paused  — switched off by its owner, still present, one toggle from live
 * deleted — soft-deleted rows only
 * all     — everything, deleted included
 *
 * The word is `paused` and not `inactive` because the only question a reader has
 * here is how this differs from `deleted`, and "inactive" does not answer it.
 */

export const RECORD_STATUS = ["active", "paused", "deleted", "all"] as const;

export type TRecordStatus = (typeof RECORD_STATUS)[number];
