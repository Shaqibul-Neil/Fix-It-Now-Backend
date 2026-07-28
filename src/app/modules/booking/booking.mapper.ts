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
  technicianName: createFullName(
    booking.technician.users.firstName,
    booking.technician.users.lastName,
  ),
  technicianEmail: booking.technician.users.email,
  technicianPhone: booking.technician.phone,
});
