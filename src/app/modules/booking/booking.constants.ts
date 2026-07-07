import { TBookingStatus } from "../../../../generated/prisma/enums";

// Customer can cancel only before work starts
export const CUSTOMER_CANCELABLE: TBookingStatus[] = [
  TBookingStatus.REQUESTED,
  TBookingStatus.ACCEPTED,
  TBookingStatus.PAID,
];
