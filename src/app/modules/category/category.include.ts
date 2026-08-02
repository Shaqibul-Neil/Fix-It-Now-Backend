import type { Prisma } from "../../../../generated/prisma/client";

// Fields exposed to public users; excludes internal status and audit fields.
export const PUBLIC_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
} as const satisfies Prisma.CategorySelect;

// Fields required for admin management, including status, timestamps, and active service count.
export const ADMIN_CATEGORY_SELECT = {
  ...PUBLIC_CATEGORY_SELECT,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { services: { where: { deletedAt: null } } },
  },
} as const satisfies Prisma.CategorySelect;

// Minimal fields needed before update/delete operations to validate record state.
export const CATEGORY_WRITE_SELECT = {
  id: true,
  name: true,
  isActive: true,
  deletedAt: true,
} as const satisfies Prisma.CategorySelect;

// Fields used to detect name conflicts, including soft-deleted records holding the same name.
export const CATEGORY_NAME_CONFLICT_SELECT = {
  id: true,
  name: true,
  deletedAt: true,
} as const satisfies Prisma.CategorySelect;
