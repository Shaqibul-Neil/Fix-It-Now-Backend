import type { Prisma } from "../../../../generated/prisma/client";
import { buildRecordStatusWhere } from "../../../utils/recordStatus";
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
