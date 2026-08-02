import type { Prisma } from "../../../../generated/prisma/client";
import { LIVE_ONLY } from "../../../utils/recordStatus";
import { PUBLIC_TECHNICIAN_WHERE } from "../technician/technician.include";

// Fields exposed to public users; excludes internal status and audit fields.
export const PUBLIC_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
} as const satisfies Prisma.CategorySelect;

export const PUBLIC_CATEGORY_DETAILS_SELECT = {
  ...PUBLIC_CATEGORY_SELECT,
  overview: true,
  coverImage: true,
  tagline: true,
  commonIssues: true,
} as const satisfies Prisma.CategorySelect;

export const PUBLIC_CATEGORY_SERVICE_WHERE = {
  ...LIVE_ONLY,
  technician: PUBLIC_TECHNICIAN_WHERE,
} as const satisfies Prisma.ServiceWhereInput;

export const CATEGORY_SERVICE_SELECT = {
  id: true,
  title: true,
  price: true,
  estimatedDuration: true,
  technicianId: true,
  technician: {
    select: { users: { select: { firstName: true, lastName: true } } },
  },
} as const satisfies Prisma.ServiceSelect;

export const CATEGORY_TECHNICIAN_SELECT = {
  id: true,
  avatar: true,
  professionalTitle: true,
  city: true,
  area: true,
  averageRating: true,
  totalReviews: true,
  hourlyRate: true,
  isFeatured: true,
  isAvailable: true,
  users: { select: { firstName: true, lastName: true } },
} as const satisfies Prisma.TechnicianProfileSelect;

// Fields required for admin management, including status, timestamps, and active service count.
export const ADMIN_CATEGORY_SELECT = {
  ...PUBLIC_CATEGORY_DETAILS_SELECT,
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
