import z from "zod";
import { RECORD_STATUS, type TRecordStatus } from "../types/types";

export const recordStatusQuerySchema = z.enum(RECORD_STATUS).optional();

// The shape both Service and Category share
type TRecordStatusWhere = {
  isActive?: boolean;
  deletedAt?: null | { not: null };
};

export const buildRecordStatusWhere = (
  status: TRecordStatus = "active",
): TRecordStatusWhere => {
  switch (status) {
    case "active":
      return { isActive: true, deletedAt: null };
    case "paused":
      return { isActive: false, deletedAt: null };
    case "deleted":
      return { deletedAt: { not: null } };
    case "all":
      return {};
  }
};

export const LIVE_ONLY = { isActive: true, deletedAt: null } as const;

export const includeDeletedQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();
