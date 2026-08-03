import type { Prisma } from "../../../../../generated/prisma/client";
import { TBookingStatus } from "../../../../../generated/prisma/enums";

export const ACTIVE_BOOKING_STATUSES = [
  TBookingStatus.REQUESTED,
  TBookingStatus.ACCEPTED,
  TBookingStatus.PAID,
  TBookingStatus.IN_PROGRESS,
] as const;

//Currently Open booking
export const CUSTOMER_ACTIVE_BOOKING_SELECT = {
  id: true,
  status: true,
  scheduledAt: true,
  categoryName: true,
  service: { select: { title: true } },
  technician: {
    select: {
      avatar: true,
      users: { select: { firstName: true, lastName: true } },
    },
  },
} as const satisfies Prisma.BookingSelect;
