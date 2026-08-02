import type { Prisma } from "../../../../generated/prisma/client";
import { createFullName } from "../../../utils/utils";
import type {
  ADMIN_BOOKING_LIST_SELECT,
  CUSTOMER_BOOKING_LIST_SELECT,
  TECHNICIAN_BOOKING_LIST_SELECT,
} from "./booking.include";

// common columns -> flat object (shared by every role mapper)
const mapBookingBase = (booking: {
  id: string;
  status: Prisma.BookingGetPayload<true>["status"];
  amount: Prisma.Decimal;
  categoryName: string;
  scheduledAt: Date;
  createdAt: Date;
  completedAt: Date | null;
  service: { id: string; title: string };
}) => ({
  id: booking.id,
  status: booking.status,
  amount: booking.amount,
  category: booking.categoryName,
  scheduledAt: booking.scheduledAt,
  createdAt: booking.createdAt,
  completedAt: booking.completedAt,
  serviceId: booking.service.id,
  serviceTitle: booking.service.title,
});

// Customer sees technician at root
export const customerBookingListMapper = (
  booking: Prisma.BookingGetPayload<{
    select: typeof CUSTOMER_BOOKING_LIST_SELECT;
  }>,
) => ({
  ...mapBookingBase(booking),
  technicianName: createFullName(
    booking.technician.users.firstName,
    booking.technician.users.lastName,
  ),
  technicianEmail: booking.technician.users.email,
  technicianPhone: booking.technician.phone,
  technicianAvatar: booking.technician.avatar,
  // Flattened out of the relation, because the row only ever needs the answer to
  // "can this be reviewed". null means no review exists yet — combined with
  // status COMPLETED that is exactly when the action is offered. The server still
  // rejects a second review on its own; this only keeps the button from lying.
  reviewId: booking.review?.id ?? null,
  reviewStatus: booking.review?.status ?? null,
});

// Technician sees customer at root
export const technicianBookingListMapper = (
  booking: Prisma.BookingGetPayload<{
    select: typeof TECHNICIAN_BOOKING_LIST_SELECT;
  }>,
) => ({
  ...mapBookingBase(booking),
  customerName: createFullName(
    booking.customer.users.firstName,
    booking.customer.users.lastName,
  ),
  customerEmail: booking.customer.users.email,
  customerPhone: booking.customer.phone,
  customerAvatar: booking.customer.avatar,
});

// Admin sees both at root
export const adminBookingListMapper = (
  booking: Prisma.BookingGetPayload<{
    select: typeof ADMIN_BOOKING_LIST_SELECT;
  }>,
) => ({
  ...mapBookingBase(booking),
  customerName: createFullName(
    booking.customer.users.firstName,
    booking.customer.users.lastName,
  ),
  customerEmail: booking.customer.users.email,
  customerPhone: booking.customer.phone,
  customerAvatar: booking.customer.avatar,
  technicianName: createFullName(
    booking.technician.users.firstName,
    booking.technician.users.lastName,
  ),
  technicianEmail: booking.technician.users.email,
  technicianPhone: booking.technician.phone,
  technicianAvatar: booking.technician.avatar,
});
