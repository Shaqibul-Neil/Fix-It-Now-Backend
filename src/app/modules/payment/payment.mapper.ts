import type { Prisma } from "../../../../generated/prisma/client";
import { createFullName } from "../../../utils/utils";
import { PAYMENT_CURRENCY } from "./payment.constants";
import type {
  ADMIN_PAYMENT_DETAILS_SELECT,
  ADMIN_PAYMENT_LIST_SELECT,
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

export const adminPaymentListMapper = (
  payment: Prisma.PaymentGetPayload<{
    select: typeof ADMIN_PAYMENT_LIST_SELECT;
  }>,
) => ({
  id: payment.id,
  status: payment.status,
  amount: payment.amount,
  provider: payment.provider,
  method: payment.method,
  transactionId: payment.transactionId,
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
  bookingId: payment.booking.id,
  bookingStatus: payment.booking.status,
  scheduledAt: payment.booking.scheduledAt,
  serviceTitle: payment.booking.service.title,
  customer: {
    id: payment.customer.id,
    name: createFullName(
      payment.customer.users.firstName,
      payment.customer.users.lastName,
    ),
    email: payment.customer.users.email,
    phone: payment.customer.phone,
  },
  technician: {
    id: payment.booking.technician.id,
    name: createFullName(
      payment.booking.technician.users.firstName,
      payment.booking.technician.users.lastName,
    ),
  },
});

export const paymentDetailsMapper = (
  payment: Prisma.PaymentGetPayload<{
    select: typeof PAYMENT_DETAILS_SELECT;
  }>,
) => ({
  id: payment.id,
  transactionId: payment.transactionId,
  amount: payment.amount,
  currency: PAYMENT_CURRENCY,
  status: payment.status,
  provider: payment.provider,
  method: payment.method,
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
  booking: {
    id: payment.booking.id,
    status: payment.booking.status,
    notes: payment.booking.notes,
    address: payment.booking.address,
    city: payment.booking.city,
    area: payment.booking.area,
    scheduledAt: payment.booking.scheduledAt,
    acceptedAt: payment.booking.acceptedAt,
    completedAt: payment.booking.completedAt,
    cancelledAt: payment.booking.cancelledAt,
  },
  service: {
    id: payment.booking.service.id,
    title: payment.booking.service.title,
    price: payment.booking.service.price,
    category: payment.booking.service.category.name,
  },
  technician: {
    id: payment.booking.technician.id,
    name: createFullName(
      payment.booking.technician.users.firstName,
      payment.booking.technician.users.lastName,
    ),
  },
});

export const adminPaymentDetailsMapper = (
  payment: Prisma.PaymentGetPayload<{
    select: typeof ADMIN_PAYMENT_DETAILS_SELECT;
  }>,
) => ({
  // The admin payload is the customer one plus the moderation extras.
  ...paymentDetailsMapper(payment),
  valId: payment.valId,
  customer: {
    id: payment.customer.id,
    name: createFullName(
      payment.customer.users.firstName,
      payment.customer.users.lastName,
    ),
    email: payment.customer.users.email,
    phone: payment.customer.phone,
  },
});
