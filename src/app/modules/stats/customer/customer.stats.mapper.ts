import type { Prisma } from "../../../../../generated/prisma/client";
import { createFullName } from "../../../../utils/utils";
import type { CUSTOMER_ACTIVE_BOOKING_SELECT } from "./customer.stats.include";

export const customerActiveBookingMapper = (
  booking: Prisma.BookingGetPayload<{
    select: typeof CUSTOMER_ACTIVE_BOOKING_SELECT;
  }>,
) => ({
  id: booking.id,
  status: booking.status,
  serviceTitle: booking.service.title,
  categoryName: booking.categoryName,
  technicianName: createFullName(
    booking.technician.users.firstName,
    booking.technician.users.lastName,
  ),
  technicianAvatar: booking.technician.avatar,
  scheduledAt: booking.scheduledAt,
});
