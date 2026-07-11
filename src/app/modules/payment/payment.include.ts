import type { Prisma } from "../../../../generated/prisma/client";

export const PAYMENT_LIST_SELECT = {
  id: true,
  amount: true,
  status: true,
  provider: true,
  method: true,
  paidAt: true,
  createdAt: true,
  booking: {
    select: {
      id: true,
      service: {
        select: {
          title: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

export const PAYMENT_DETAILS_SELECT = {
  id: true,
  transactionId: true,
  amount: true,
  status: true,
  provider: true,
  method: true,
  valId: true,
  paidAt: true,
  createdAt: true,

  booking: {
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      address: true,
      city: true,
      area: true,

      service: {
        select: {
          id: true,
          title: true,
          price: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

export const PAYMENT_FINALIZE_SELECT = {
  id: true,
  amount: true,
  status: true,
  bookingId: true,
  booking: {
    select: {
      customer: {
        select: {
          userId: true,
          users: { select: { firstName: true, lastName: true } },
        },
      },
      technician: { select: { userId: true } },
    },
  },
} as const satisfies Prisma.PaymentSelect;

// payment loaded on gateway failure/cancel (+ customer for notify)
export const PAYMENT_FAILURE_SELECT = {
  id: true,
  status: true,
  bookingId: true,
  booking: {
    select: {
      customer: {
        select: {
          userId: true,
          users: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} as const satisfies Prisma.PaymentSelect;

// booking lookup when initiating a payment
export const PAYMENT_CREATE_BOOKING_SELECT = {
  id: true,
  customerId: true,
  status: true,
  amount: true,
  address: true,
  service: { select: { title: true } },
} as const satisfies Prisma.BookingSelect;

// customer contact required by the payment gateway
export const PAYMENT_GATEWAY_CUSTOMER_SELECT = {
  firstName: true,
  lastName: true,
  email: true,
} as const satisfies Prisma.UserSelect;
