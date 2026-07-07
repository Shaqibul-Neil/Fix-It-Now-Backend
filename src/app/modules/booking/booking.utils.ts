import httpStatus from "http-status";
import { TRole, type Prisma } from "../../../../generated/prisma/client";
import { AppError } from "../../../utils/appError";
import { generateSlug } from "../../../utils/utils";
import {
  ADMIN_BOOKING_INCLUDE,
  CUSTOMER_BOOKING_INCLUDE,
  TECHNICIAN_BOOKING_INCLUDE,
} from "./booking.include";
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

    service: {
      ...(query.category && {
        category: {
          slug: generateSlug(query.category),
        },
      }),
      ...(query.search && {
        title: {
          contains: query.search,
          mode: "insensitive",
        },
      }),
    },
  };
};

export const getBookingInclude = (role: TRole): Prisma.BookingInclude => {
  switch (role) {
    case TRole.CUSTOMER:
      return CUSTOMER_BOOKING_INCLUDE;

    case TRole.TECHNICIAN:
      return TECHNICIAN_BOOKING_INCLUDE;

    case TRole.ADMIN:
      return ADMIN_BOOKING_INCLUDE;

    default:
      throw new AppError(
        "You are not allowed to view bookings.",
        httpStatus.FORBIDDEN,
      );
  }
};
