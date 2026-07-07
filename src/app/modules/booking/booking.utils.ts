import type { Prisma } from "../../../../generated/prisma/client";
import { generateSlug } from "../../../utils/utils";
import type { TListBookingsQuery } from "./booking.validation";

export const buildBookingFilter = (
  baseWhere: Prisma.BookingWhereInput,
  query: TListBookingsQuery,
): Prisma.BookingWhereInput => {
  return {
    ...baseWhere,
    ...(query.status && {
      status: query.status,
    }),

    ...(query.category && {
      service: {
        category: {
          slug: generateSlug(query.category),
        },
      },
    }),

    ...(query.search && {
      service: {
        title: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    }),
  };
};
