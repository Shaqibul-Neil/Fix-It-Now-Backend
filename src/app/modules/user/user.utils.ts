import type { Prisma } from "../../../../generated/prisma/client";
import type { TListUsersQuery } from "./user.validation";

export const buildUserFilter = (
  query: TListUsersQuery,
): Prisma.UserWhereInput => {
  return {
    ...(query.role && { role: query.role }),
    ...(query.status && { status: query.status }),
    ...(query.search && {
      OR: [
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ],
    }),
  };
};
