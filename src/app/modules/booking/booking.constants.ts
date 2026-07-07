import { TBookingStatus } from "../../../../generated/prisma/enums";

// Customer can cancel only before work starts
export const CUSTOMER_CANCELABLE: TBookingStatus[] = [
  TBookingStatus.REQUESTED,
  TBookingStatus.ACCEPTED,
  TBookingStatus.PAID,
];

// Technician can change booking only while it is active
export const TECHNICIAN_EDITABLE: TBookingStatus[] = [
  TBookingStatus.REQUESTED,
  TBookingStatus.ACCEPTED,
  TBookingStatus.IN_PROGRESS,
];

// Admin has no status restriction
export const ADMIN_EDITABLE = Object.values(TBookingStatus);
