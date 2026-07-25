import type { Prisma } from "../../../../generated/prisma/client";
import type { BOOKING_LIST_SELECT } from "./booking.include";

export const bookingListMapper = (
  booking: Prisma.BookingGetPayload<{
    select: typeof BOOKING_LIST_SELECT;
  }>,
) => ({
  id: booking.id,
  status: booking.status,
  amount: booking.amount,
  category: booking.categoryName,
  scheduledAt: booking.scheduledAt,
  createdAt: booking.createdAt,
  serviceId: booking.service.id,
  serviceTitle: booking.service.title,
});
