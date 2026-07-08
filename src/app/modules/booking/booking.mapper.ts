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
  scheduledAt: booking.scheduledAt,
  createdAt: booking.createdAt,
  serviceId: booking.service.id,
  serviceTitle: booking.service.title,
  servicePrice: booking.service.price,
  category: booking.service.category.name,
});
