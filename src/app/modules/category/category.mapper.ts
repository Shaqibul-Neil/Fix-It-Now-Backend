import type { Prisma } from "../../../../generated/prisma/client";
import type { ADMIN_CATEGORY_SELECT } from "./category.include";

export const categoryAdminMapper = (
  category: Prisma.CategoryGetPayload<{
    select: typeof ADMIN_CATEGORY_SELECT;
  }>,
) => {
  const { _count, ...rest } = category;

  return {
    ...rest,
    totalServices: _count.services,
    isDeleted: Boolean(category.deletedAt),
  };
};
