import type { Prisma } from "../../../../generated/prisma/client";
import type { PAYMENT_LIST_SELECT } from "./payment.include";

export const paymentListMapper = (
  payment: Prisma.PaymentGetPayload<{
    select: typeof PAYMENT_LIST_SELECT;
  }>,
) => ({
  id: payment.id,
  status: payment.status,
  amount: payment.amount,
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
  bookingId: payment.booking.id,
  serviceTitle: payment.booking.service.title,
  provider: payment.provider,
  method: payment.method,
});
