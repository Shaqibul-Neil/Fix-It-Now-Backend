import type { Prisma } from "../../../../generated/prisma/client";
import { buildRecordStatusWhere, LIVE_ONLY } from "../../../utils/recordStatus";
import { generateSlug } from "../../../utils/utils";
import { PUBLIC_TECHNICIAN_WHERE } from "../technician/technician.include";
import type {
  TListManagedServicesQuery,
  TListServicesQuery,
} from "./service.validation";

// title search
const buildServiceTitleSearch = (
  query: TListServicesQuery,
): Prisma.ServiceWhereInput =>
  query.search
    ? { title: { contains: query.search, mode: "insensitive" } }
    : {};

// the category the caller asked for
const buildCategorySlugFilter = (
  query: TListServicesQuery,
): Prisma.CategoryWhereInput =>
  query.category ? { slug: generateSlug(query.category) } : {};

// where the technician works and how well they are rated
const buildTechnicianScopeFilter = (
  query: TListServicesQuery,
): Prisma.TechnicianProfileWhereInput => ({
  ...(query.city && {
    city: {
      contains: query.city,
      mode: "insensitive",
    },
  }),
  ...(query.area && {
    area: {
      contains: query.area,
      mode: "insensitive",
    },
  }),
  ...(query.minRating !== undefined && {
    averageRating: {
      gte: query.minRating,
    },
  }),
});

// ---------- Public Service Filter ----------
export const buildServiceFilter = (
  query: TListServicesQuery,
): Prisma.ServiceWhereInput => ({
  ...LIVE_ONLY,
  ...buildServiceTitleSearch(query),
  category: {
    ...buildCategorySlugFilter(query),
    ...LIVE_ONLY,
  },
  technician: {
    ...buildTechnicianScopeFilter(query),
    ...PUBLIC_TECHNICIAN_WHERE,
  },
});

// ---------- Technician's Own Services Filter ----------
export const buildMyServiceFilter = (
  technicianId: string,
  query: TListManagedServicesQuery,
): Prisma.ServiceWhereInput => ({
  technicianId,
  ...buildRecordStatusWhere(query.status),
  ...buildServiceTitleSearch(query),
  ...(query.category && { category: buildCategorySlugFilter(query) }),
});

// ---------- Admin Service Filter ----------
export const buildAdminServiceFilter = (
  query: TListManagedServicesQuery,
): Prisma.ServiceWhereInput => ({
  ...buildRecordStatusWhere(query.status),
  ...buildServiceTitleSearch(query),
  ...(query.category && { category: buildCategorySlugFilter(query) }),
  technician: buildTechnicianScopeFilter(query),
});
