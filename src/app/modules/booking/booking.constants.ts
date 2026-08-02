import { TBookingStatus } from "../../../../generated/prisma/enums";

// Customer can cancel only before work starts
export const CUSTOMER_CANCELABLE: TBookingStatus[] = [
  TBookingStatus.REQUESTED,
  TBookingStatus.ACCEPTED,
  TBookingStatus.PAID,
];

// Bookings that still owe someone something — the ones that block a second booking on the same slot, and the ones a service removal has to warn about.
export const ACTIVE_BOOKING_STATUSES: TBookingStatus[] = [
  TBookingStatus.REQUESTED,
  TBookingStatus.ACCEPTED,
  TBookingStatus.PAID,
  TBookingStatus.IN_PROGRESS,
];
