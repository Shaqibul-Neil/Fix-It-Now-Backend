import type { Prisma } from "../../../../generated/prisma/client";
import type { TAdminListReviewQuery } from "./review.validation";

// The admin query is a superset of the customer and public ones, so it types
// every caller; `search` simply never survives validation on the other routes.
export const buildReviewFilter = (
  baseWhere: Prisma.ReviewWhereInput,
  query: TAdminListReviewQuery,
): Prisma.ReviewWhereInput => {
  const search = query.search;

  return {
    ...(query.status && {
      status: query.status,
    }),
    ...(query.rating && { rating: query.rating }),
    ...(search && {
      OR: [
        {
          technician: {
            users: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          customer: {
            users: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
        { service: { title: { contains: search, mode: "insensitive" } } },
      ],
    }),
    // Server-set scope spread last so no query param can widen it.
    ...baseWhere,
  };
};
