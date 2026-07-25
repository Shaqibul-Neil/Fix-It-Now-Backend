import {
  TReviewStatus,
  type Prisma,
} from "../../../../generated/prisma/client";
import type { TListReviewQuery } from "./review.validation";

export const buildReviewFilter = (
  baseWhere: Prisma.ReviewWhereInput,
  query: TListReviewQuery,
): Prisma.ReviewWhereInput => {
  return {
    ...(query.status && {
      status: query.status,
    }),
    ...(query.rating && { rating: query.rating }),
    ...baseWhere,
  };
};
