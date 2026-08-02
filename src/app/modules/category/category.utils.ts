import type { Prisma } from "../../../../generated/prisma/client";
import { buildRecordStatusWhere, LIVE_ONLY } from "../../../utils/recordStatus";
import { PUBLIC_TECHNICIAN_WHERE } from "../technician/technician.include";
import { PUBLIC_CATEGORY_SERVICE_WHERE } from "./category.include";
import type { TListCategoryAdminQuery } from "./category.validation";

export const buildCategoryFilter = (
  query: TListCategoryAdminQuery,
): Prisma.CategoryWhereInput => ({
  ...buildRecordStatusWhere(query.status),

  ...(query.search && {
    OR: [
      { name: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
    ],
  }),
});

export const buildCategoryServiceFilter = (
  categoryId: string,
): Prisma.ServiceWhereInput => ({
  categoryId,
  ...PUBLIC_CATEGORY_SERVICE_WHERE,
});

export const buildCategoryTechnicianFilter = (
  categoryId: string,
): Prisma.TechnicianProfileWhereInput => ({
  ...PUBLIC_TECHNICIAN_WHERE,
  services: { some: { categoryId, ...LIVE_ONLY } },
});
