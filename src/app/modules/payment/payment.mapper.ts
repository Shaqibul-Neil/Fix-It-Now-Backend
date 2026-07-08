import type { Prisma } from "../../../../generated/prisma/client";
import type {
  PAYMENT_DETAILS_SELECT,
  PAYMENT_LIST_SELECT,
} from "./payment.include";

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

export const paymentDetailsMapper = (
  payment: Prisma.PaymentGetPayload<{
    select: typeof PAYMENT_DETAILS_SELECT;
  }>,
) => ({
  id: payment.id,
  transactionId: payment.transactionId,
  amount: payment.amount,
  status: payment.status,
  provider: payment.provider,
  method: payment.method,
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
  booking: {
    id: payment.booking.id,
    status: payment.booking.status,
    scheduledAt: payment.booking.scheduledAt,
    address: payment.booking.address,
    city: payment.booking.city,
    area: payment.booking.area,
  },
  service: {
    id: payment.booking.service.id,
    title: payment.booking.service.title,
    price: payment.booking.service.price,
    category: payment.booking.service.category.name,
  },
});
